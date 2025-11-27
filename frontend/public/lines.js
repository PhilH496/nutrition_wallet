const ANIMATION_CONFIG = {
    densityMultiplier: 0.05,
    movementVelocity: 45,
    segmentLength: 10,
    maxSegments: 70,
    segmentVariation: 10,
    animationDuration: 5000 // 5 seconds in milliseconds
}

const animationState = {
    isComplete: false,
    isRunning: false,
    pathCollection: [],
    startTimestamp: null,
    animationId: null
}

// Initialize animation system when page loads
window.addEventListener("load", () => {
    const drawingSurface = document.getElementById("animated-canvas")
    const renderingContext = drawingSurface.getContext("2d")

    // Handle canvas resizing and regeneration
    const updateCanvasDimensions = () => {
        drawingSurface.width = window.innerWidth
        drawingSurface.height = window.innerHeight

        // Reset and regenerate paths
        animationState.pathCollection = []
        createInitialPaths()
        
        if (!animationState.isRunning) {
            animationState.isRunning = true
            animationState.isComplete = false
            animationState.startTimestamp = null
            startAnimationLoop()
        }
    }

    // Generate paths from screen edges
    const createInitialPaths = () => {
        const horizontalPathCount = Math.floor(drawingSurface.height * 2 * ANIMATION_CONFIG.densityMultiplier)
        const verticalPathCount = Math.floor(drawingSurface.width * 2 * ANIMATION_CONFIG.densityMultiplier)

        // Create horizontal paths from left and right edges
        for (let index = 0; index < horizontalPathCount; index++) {
            if (index < horizontalPathCount / 2) {
                const startX = 0
                const startY = (index / horizontalPathCount) * 2 * drawingSurface.height
                const movementVector = [1, 0]
                animationState.pathCollection.push(new MeanderingPath(startX, startY, movementVector))
            } else {
                const startX = drawingSurface.width
                const startY = ((index - horizontalPathCount / 2) / horizontalPathCount) * 2 * drawingSurface.height
                const movementVector = [-1, 0]
                animationState.pathCollection.push(new MeanderingPath(startX, startY, movementVector))
            }
        }

        // Create vertical paths from top and bottom edges
        for (let index = 0; index < verticalPathCount; index++) {
            if (index < verticalPathCount / 2) {
                const startX = (index / verticalPathCount) * 2 * drawingSurface.width
                const startY = 0
                const movementVector = [0, 1]
                animationState.pathCollection.push(new MeanderingPath(startX, startY, movementVector))
            } else {
                const startX = ((index - verticalPathCount / 2) / verticalPathCount) * 2 * drawingSurface.width
                const startY = drawingSurface.height
                const movementVector = [0, -1]
                animationState.pathCollection.push(new MeanderingPath(startX, startY, movementVector))
            }
        }
    }

    let previousFrameTime = 0
    let frameDelta = 0

    // Main animation loop with time-based stopping
    const startAnimationLoop = () => {
        const renderFrame = (currentTime) => {
            // Initialize start timestamp on first frame
            if (!animationState.startTimestamp) {
                animationState.startTimestamp = currentTime
            }

            // Check if 5 seconds have elapsed
            const elapsedTime = currentTime - animationState.startTimestamp
            if (elapsedTime >= ANIMATION_CONFIG.animationDuration) {
                animationState.isComplete = true
                animationState.isRunning = false
                animationState.animationId = null
                return // Stop animation
            }

            frameDelta = (currentTime - previousFrameTime) / 1000 // Convert to seconds
            previousFrameTime = currentTime

            if (!animationState.isComplete) {
                renderingContext.clearRect(0, 0, drawingSurface.width, drawingSurface.height)

                animationState.isComplete = true
                animationState.pathCollection.forEach((path) => {
                    animationState.isComplete = animationState.isComplete && path.hasFinished
                    path.renderPath(frameDelta)
                })
                
                animationState.animationId = requestAnimationFrame(renderFrame)
            } else {
                animationState.isRunning = false
                animationState.animationId = null
            }
        }

        animationState.animationId = requestAnimationFrame(renderFrame)
    }

    // Initialize canvas and start animation
    updateCanvasDimensions()
    window.addEventListener("resize", updateCanvasDimensions)

    function MeanderingPath(initialX, initialY, initialDirection) {
        const startingPoint = {
            x: initialX,
            y: initialY,
        }

        this.currentX = initialX
        this.currentY = initialY
        this.progressInSegment = 0
        this.pathPoints = []
        this.currentDirection = initialDirection
        this.hasFinished = false

        // Calculate segment count based on screen width
        const baseSegmentCount = Math.min(
            Math.floor(drawingSurface.width / 14),
            ANIMATION_CONFIG.maxSegments,
        )
        this.totalSegments = baseSegmentCount + Math.round(
            Math.random() * ANIMATION_CONFIG.segmentVariation - 
            ANIMATION_CONFIG.segmentVariation / 2,
        )

        // Create new path segment
        this.addNewSegment = () => {
            this.pathPoints.push([this.currentX, this.currentY])

            if (this.currentDirection[1] === 0) {
                this.currentDirection = [0, Math.random() > 0.5 ? 1 : -1]
            } else {
                this.currentDirection = [Math.random() > 0.5 ? 1 : -1, 0]
            }
        }

        // Render the path
        this.renderPath = (timeDelta) => {
            if (!this.hasFinished && !isNaN(timeDelta)) {
                this.progressInSegment += ANIMATION_CONFIG.movementVelocity * timeDelta
            }

            // Complete full segments
            while (this.progressInSegment >= ANIMATION_CONFIG.segmentLength) {
                this.currentX += this.currentDirection[0] * ANIMATION_CONFIG.segmentLength
                this.currentY += this.currentDirection[1] * ANIMATION_CONFIG.segmentLength
                this.addNewSegment()
                this.progressInSegment -= ANIMATION_CONFIG.segmentLength
            }

            // Draw the complete path
            renderingContext.beginPath()
            renderingContext.lineWidth = 2
            renderingContext.strokeStyle = "#677a78"
            renderingContext.moveTo(startingPoint.x, startingPoint.y)

            this.pathPoints.forEach(([pointX, pointY]) => {
                renderingContext.lineTo(pointX, pointY)
            })

            // Draw current segment in progress
            const progressX = this.currentX + this.currentDirection[0] * this.progressInSegment
            const progressY = this.currentY + this.currentDirection[1] * this.progressInSegment
            renderingContext.lineTo(progressX, progressY)
            renderingContext.stroke()

            if (this.pathPoints.length >= this.totalSegments) {
                this.hasFinished = true
            }
        }
    }
})