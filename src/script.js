/**
 * Hero cursor-tracking sprite animation
 *
 * Sprite sheet: 16 columns x 15 rows, 240 frames, each frame 640x360px
 * (native source resolution), read left-to-right, top-to-bottom (index 0..239).
 */

const SPRITE_SRC = '/images/hero-cursor-sprite.jpg'
const COLS = 16
const ROWS = 15
const FRAME_W = 640
const FRAME_H = 360
const TOTAL_FRAMES = COLS * ROWS // 240

// angle (deg, 0..360) -> frame index anchors, piecewise linear, circular
const ANCHORS = [
    { angle: 0, frame: 38 },
    { angle: 90, frame: 63 },
    { angle: 180, frame: 96 },
    { angle: 270, frame: 162 },
    { angle: 360, frame: 38 },
]

const NEUTRAL_FRAME = 0
const DEADZONE_RATIO = 0.10
const LERP_FACTOR = 0.15

// extra zoom (beyond the minimum "cover" crop) and horizontal bias used to
// shift the character toward the right of the hero, clearing the left side
// for the overlaid text. 0 = subject pushed fully right, 1 = fully left.
const HORIZONTAL_ZOOM = 1.35
const HORIZONTAL_BIAS = 0.1

function angleToFrame(angleDeg) {
    const a = ((angleDeg % 360) + 360) % 360
    for (let i = 0; i < ANCHORS.length - 1; i++) {
        const a0 = ANCHORS[i]
        const a1 = ANCHORS[i + 1]
        if (a >= a0.angle && a <= a1.angle) {
            const t = (a - a0.angle) / (a1.angle - a0.angle)
            return a0.frame + (a1.frame - a0.frame) * t
        }
    }
    return ANCHORS[0].frame
}

// shortest circular distance between two frame indices on a TOTAL_FRAMES ring
function shortestFrameDelta(from, to) {
    let diff = (to - from) % TOTAL_FRAMES
    if (diff > TOTAL_FRAMES / 2) diff -= TOTAL_FRAMES
    if (diff < -TOTAL_FRAMES / 2) diff += TOTAL_FRAMES
    return diff
}

function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const container = canvas.parentElement

    const img = new Image()
    let ready = false

    let currentFrame = NEUTRAL_FRAME
    let targetFrame = NEUTRAL_FRAME
    let lastDrawnIndex = -1
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2

    function resizeCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 2)
        const rect = container.getBoundingClientRect()

        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)

        lastDrawnIndex = -1 // force redraw after resize
    }

    // crop the source frame to "cover" the canvas's own aspect ratio,
    // so the character fills the area edge-to-edge without distortion
    function getCoverSourceRect() {
        const frameAspect = FRAME_W / FRAME_H
        const destAspect = canvas.width / canvas.height

        // minimum crop that still covers the canvas, before the extra zoom/bias below
        let baseW, baseH
        if (destAspect > frameAspect) {
            baseW = FRAME_W
            baseH = FRAME_W / destAspect
        } else {
            baseH = FRAME_H
            baseW = FRAME_H * destAspect
        }

        // only apply the extra zoom + rightward bias on the desktop overlay
        // layout, where the subject needs to clear the text on the left.
        // On the stacked mobile layout the canvas is narrow/tall, so the same
        // bias would crop the subject almost entirely out of frame -- and
        // there's no overlapping text there to clear anyway.
        const isDesktopLayout = window.innerWidth > 860
        const zoom = isDesktopLayout ? HORIZONTAL_ZOOM : 1
        const biasX = isDesktopLayout ? HORIZONTAL_BIAS : 0.5

        const sW = baseW / zoom
        const sH = baseH / zoom
        const maxSx = FRAME_W - sW
        const maxSy = FRAME_H - sH

        return {
            sx: biasX * maxSx,
            sy: 0.5 * maxSy,
            sW,
            sH,
        }
    }

    function drawFrame(index) {
        const i = Math.round(index)
        if (i === lastDrawnIndex) return
        lastDrawnIndex = i

        const col = i % COLS
        const row = Math.floor(i / COLS)
        const frameX = col * FRAME_W
        const frameY = row * FRAME_H

        const { sx, sy, sW, sH } = getCoverSourceRect()

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
            img,
            frameX + sx, frameY + sy, sW, sH,
            0, 0, canvas.width, canvas.height
        )
    }

    function computeTargetFrame() {
        const rect = canvas.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const dx = mouseX - centerX
        const dy = mouseY - centerY
        const dist = Math.hypot(dx, dy)

        const deadzone = DEADZONE_RATIO * Math.min(window.innerWidth, window.innerHeight)

        if (dist < deadzone) {
            return NEUTRAL_FRAME
        }

        const angleRad = Math.atan2(dy, dx)
        const angleDeg = angleRad * (180 / Math.PI)
        return angleToFrame(angleDeg)
    }

    function tick() {
        if (ready) {
            targetFrame = computeTargetFrame()

            const delta = shortestFrameDelta(currentFrame, targetFrame)
            currentFrame += delta * LERP_FACTOR
            currentFrame = ((currentFrame % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES

            drawFrame(currentFrame)
        }
        requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', (e) => {
        mouseX = e.clientX
        mouseY = e.clientY
    })

    window.addEventListener('resize', resizeCanvas)

    img.onload = () => {
        ready = true
        resizeCanvas()
        drawFrame(NEUTRAL_FRAME)
    }
    img.src = SPRITE_SRC

    resizeCanvas()
    requestAnimationFrame(tick)
}

function initPortfolioTabs() {
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => {
                t.classList.remove('is-active')
                t.setAttribute('aria-selected', 'false')
            })
            tab.classList.add('is-active')
            tab.setAttribute('aria-selected', 'true')
        })
    })
}

initHeroCanvas()
initPortfolioTabs()
