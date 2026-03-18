class Graph {
    constructor() {
        this.nodes = []
        this.edges = []
        this.directed = false
    }

    update(timeStep) {
        this.edges = this.edges.filter(edge => !edge.shouldBeDeleted)
        this.nodes = this.nodes.filter(node => !node.shouldBeDeleted)

        for (let node of this.nodes) {
            node.update(timeStep)

            if (game.force) {
                for (let otherNode of this.nodes) {
                    if (node !== otherNode) {
                        let dx = node.x - otherNode.x
                        let dy = node.y - otherNode.y
                        let distance = Math.sqrt(dx * dx + dy * dy)
                        if (distance < node.size + otherNode.size) {
                            node.applyForce(10, dx, dy)
                        }
                    }
                }
            }
        }

        for (let edge of this.edges) {
            edge.update(timeStep)

            if (game.force) {
                edge.applyEdgeForces(this.nodes.length * 70, 0.08)
            }
        }
    }

    clearSelections() {
        for (let node of this.nodes) {
            node.selected = false
            node.color = "#000000"
        }

        for (let edge of this.edges) {
            edge.selected = false
            edge.color = "#000000"
        }
    }
}

class Node {
    constructor(x, y, label) {
        this.size = 40
        
        this.x = x
        this.y = y
        this.label = label
        this.color = "#000000"

        this.velocityX = 0
        this.velocityY = 0
        this.selected = false
        this.shouldBeDeleted = false
    }

    update(timeStep) {
        this.x += this.velocityX * timeStep
        this.y += this.velocityY * timeStep
        this.velocityX *= 0.9
        this.velocityY *= 0.9
        this.clamp()
    }

    isPointInside(px, py) {
        let dx = px - this.x
        let dy = py - this.y
        return dx * dx + dy * dy <= this.size * this.size
    }

    clamp() {
        this.x = Math.min(Math.max(0, this.x), canvas.width)
        this.y = Math.min(Math.max(0, this.y), canvas.height)
        this.velocityX = Math.min(Math.max(-1000, this.velocityX), 1000)
        this.velocityY = Math.min(Math.max(-1000, this.velocityY), 1000)
        this.size = Math.min(Math.max(20, this.size), 80)
    }

    applyForce(force, dx, dy) {
        let length = Math.sqrt(dx * dx + dy * dy)
        this.velocityX += (dx / length) * force
        this.velocityY += (dy / length) * force
    }
}

class Edge {
    constructor(from, to, weight=1) {
        this.from = from
        this.to = to
        this.weight = weight
        this.color = "#000000"

        this.selected = false
        this.shouldBeDeleted = false
    }

    update(timeStep) {
        this.clamp()
    }

    isPointInside(px, py) {
        let dx = this.to.x - this.from.x
        let dy = this.to.y - this.from.y
        let length = Math.sqrt(dx * dx + dy * dy)
        let t = ((px - this.from.x) * dx + (py - this.from.y) * dy) / (length * length)

        if (t >= 0 && t <= 1) {
            let closestX = this.from.x + t * dx
            let closestY = this.from.y + t * dy
            let distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
            return distance < 10
        }

        return false
    }

    applyEdgeForces(nodeDistance, strength) {
        let dx = this.from.x - this.to.x
        let dy = this.from.y - this.to.y
        let distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
            let targetDistance = this.from.size + this.to.size + nodeDistance
            let force = (distance - targetDistance) * strength            
            let fx = (dx / distance) * force
            let fy = (dy / distance) * force

            this.from.velocityX -= fx
            this.from.velocityY -= fy
            this.to.velocityX += fx
            this.to.velocityY += fy
        }
    }

    clamp() {
        this.weight = Math.min(Math.max(0, this.weight), 5)
    }
}

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
var lastTime = 0, accumulator = 0, fixedTimeStep = 1 / 60

const game = {
    graph: new Graph(),
    force: true,
    connectWhenInserting: true,
    transform: {
        scale: 1,
        offsetX: 0,
        offsetY: 0
    }
}

function relativeLuminance(hexColor) {
    let r = parseInt(hexColor.substr(1, 2), 16)
    let g = parseInt(hexColor.substr(3, 2), 16)
    let b = parseInt(hexColor.substr(5, 2), 16)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function drawTitle() {
    ctx.fillStyle = "black"
    ctx.font = "8em Times"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("Graph", 10, 10)
}

function drawNode(node) {
    ctx.fillStyle = node.selected ? "red" : node.color
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = relativeLuminance(node.color) < 128 ? "white" : "black"
    ctx.font = "2em Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(node.label, node.x, node.y)
}

function drawEdge(edge) {
    var dx = edge.to.x - edge.from.x
    var dy = edge.to.y - edge.from.y
    var angle = Math.atan2(dy, dx)

    var headlen = (edge.from.size + edge.to.size) * 0.2 + 20

    // move endpoint to node rim
    var toX = edge.to.x - Math.cos(angle) * edge.to.size
    var toY = edge.to.y - Math.sin(angle) * edge.to.size

    ctx.strokeStyle = edge.selected ? "red" : edge.color
    ctx.lineWidth = (edge.from.size + edge.to.size) * 0.1 + edge.weight
    ctx.lineCap = "round"

    ctx.beginPath()
    ctx.moveTo(edge.from.x, edge.from.y)
    ctx.lineTo(toX, toY)
    ctx.moveTo(toX, toY)

    if (game.graph.directed) {
        // arrow head
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(toX, toY)
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        )
    }

    ctx.stroke()
}

function drawStatus() {
    let nodesSelected = game.graph.nodes.filter(node => node.selected).length
    let edgesSelected = game.graph.edges.filter(edge => edge.selected).length
    
    let text = ""
    if (nodesSelected == 0 && edgesSelected == 0)      text += `${game.graph.nodes.length} Nodes, ${game.graph.edges.length} Edges`
    else if (nodesSelected == 1 && edgesSelected == 0) text += `Node ${game.graph.nodes.find(n => n.selected).label} has been selected`
    else if (nodesSelected > 1 && edgesSelected == 0)  text += `${nodesSelected} Nodes have been selected`
    else                                               text += `${nodesSelected} Nodes and ${edgesSelected} Edges have been selected`

    ctx.fillStyle = "gray"
    ctx.font = "2.5em Arial"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(text, 15, 160)
}

function draw(alpha) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(game.transform.scale, 0, 0, game.transform.scale, game.transform.offsetX, game.transform.offsetY)

    for (let edge of game.graph.edges) {
        drawEdge(edge)
    }

    for (let node of game.graph.nodes) {
        drawNode(node)
    }

    ctx.resetTransform()

    drawTitle()
    drawStatus()
}

function updateNodeInfo() {
    let nodesSelected = game.graph.nodes.filter(node => node.selected).length
    let edgesSelected = game.graph.edges.filter(edge => edge.selected).length
    
    let nodeLabelInput = document.getElementById("node-label-input")
    let edgeSizeInput = document.getElementById("edge-weight-input")

    if (nodesSelected == 1 && edgesSelected == 0) {
        let node = game.graph.nodes.find(n => n.selected)
        nodeLabelInput.value = node.label
    } else if (edgesSelected == 1 && nodesSelected == 0) {
        let edge = game.graph.edges.find(e => e.selected)
        edgeSizeInput.value = edge.weight
    } else {
        nodeLabelInput.value = ""
        edgeSizeInput.value = ""
    }

    /* action zone */
    let connectNodesButton = document.getElementById("connect-nodes-button")
    if (nodesSelected == 2 && edgesSelected == 0) {
        showWithFade(connectNodesButton)
    } else {
        hideWithFade(connectNodesButton)
    }
}

function update(timeStep) {
    game.graph.update(timeStep)
    clampTransforms()
}

function loop(timestamp) {
    const currentTime = timestamp / 1000
    deltaTime = currentTime - lastTime
    lastTime = currentTime

    deltaTime = Math.min(deltaTime, 0.25)
    accumulator += deltaTime
    
    while (accumulator >= fixedTimeStep) {
        update(fixedTimeStep)
        accumulator -= fixedTimeStep
    }
    
    const alpha = accumulator / fixedTimeStep
    draw(alpha)
    
    requestAnimationFrame(loop)
}

function clampTransforms() {
    game.transform.scale = Math.min(Math.max(0.4, game.transform.scale), 5)
    game.transform.offsetX = Math.min(Math.max(-canvas.width/2, game.transform.offsetX), canvas.width*3/2)
    game.transform.offsetY = Math.min(Math.max(-canvas.height/2, game.transform.offsetY), canvas.height*3/2)
}

function triangle() {
    let middleX = canvas.width / 2
    let middleY = canvas.height / 2
    
    game.graph.nodes = []
    game.graph.edges = []
    game.graph.nodes.push(new Node(middleX - 200, middleY - 200, "A"))
    game.graph.nodes.push(new Node(middleX - 300, middleY + 100, "B"))
    game.graph.nodes.push(new Node(middleX, middleY, "C"))
    game.graph.edges.push(new Edge(game.graph.nodes[0], game.graph.nodes[1], 4))
    game.graph.edges.push(new Edge(game.graph.nodes[1], game.graph.nodes[2], 2))
    game.graph.edges.push(new Edge(game.graph.nodes[2], game.graph.nodes[0], 6))
}

function pentagon() {
    let middleX = canvas.width / 2
    let middleY = canvas.height / 2
    
    game.graph.nodes = []
    game.graph.edges = []
    for (let i = 0; i < 5; i++) {
        let angle = (i / 5) * 2 * Math.PI - Math.PI / 2
        game.graph.nodes.push(new Node(middleX + Math.cos(angle) * 200, middleY + Math.sin(angle) * 200, String.fromCharCode(65 + i)))
    }
    for (let i = 0; i < 5; i++) {
        game.graph.edges.push(new Edge(game.graph.nodes[i], game.graph.nodes[(i + 1) % 5], Math.floor(Math.random() * 5) + 1))
    }
}

function hideWithFade(el) {
    el.classList.add("fade-out")

    setTimeout(() => {
        el.classList.add("hidden")
    }, 500)
}

function showWithFade(el) {
    el.classList.remove("hidden")
    el.classList.add("fade-out")

    requestAnimationFrame(() => {
        el.classList.remove("fade-out")
    })
}

function init() {
    /* inputs */

    let mousemoved = false
    let draggingNode = null

    canvas.onmousedown = (e) => {
        mousemoved = false

        for (let node of game.graph.nodes) {
            if (node.isPointInside(e.clientX * 2, e.clientY * 2)) {
                draggingNode = node
                break
            }
        }
    }

    canvas.onmouseup = (e) => {
        draggingNode = null
    }

    canvas.onmousemove = (e) => {
        if (e.buttons === 1) {
            mousemoved = true

            if (draggingNode) {
                draggingNode.velocityX += e.movementX * 10
                draggingNode.velocityY += e.movementY * 10
            } else {
                for (let node of game.graph.nodes) {
                    node.velocityX += e.movementX * 10
                    node.velocityY += e.movementY * 10
                }
            }
        }
    }

    canvas.onwheel = (e) => {
        for (let node of game.graph.nodes) {
            node.size += e.deltaY * -0.03
            node.clamp()
        }
    }

    canvas.onclick = (e) => {
        if (mousemoved) return

        let rect = canvas.getBoundingClientRect()
        let x = (e.clientX - rect.left) * 2
        let y = (e.clientY - rect.top) * 2

        for (let node of game.graph.nodes) {
            if (node.isPointInside(x, y)) {
                node.selected = !node.selected
                updateNodeInfo()
                return
            }
        }

        for (let edge of game.graph.edges) {
            if (edge.isPointInside(x, y)) {
                edge.selected = !edge.selected
                updateNodeInfo()
                return
            }
        }

        let newNode = new Node(x, y, String.fromCharCode(65 + game.graph.nodes.length))
        game.graph.nodes.push(newNode)
        if (game.connectWhenInserting) {
            for (let node of game.graph.nodes) {
                if (node !== game.graph.nodes[game.graph.nodes.length - 1]) {
                    game.graph.edges.push(new Edge(newNode, node))
                }
            }
        }

        updateNodeInfo()
    }

    document.onkeydown = (e) => {
        if (e.key === "Delete") {
            game.graph.edges.filter(edge => edge.selected || edge.from.selected || edge.to.selected).forEach(edge => edge.shouldBeDeleted = true)
            game.graph.nodes.filter(node => node.selected).forEach(node => node.shouldBeDeleted = true)
        }

        updateNodeInfo()
    }

    /* bottom panel */

    document.getElementById("clear-button").onclick = () => {
        game.graph.clearSelections()
    }

    document.getElementById("stop-force-input").checked = game.force
    document.getElementById("stop-force-input").onchange = (e) => {
        game.force = e.target.checked
    }

    document.getElementById("triangle-button").onclick = () => {
        triangle()
    }

    document.getElementById("pentagon-button").onclick = () => {
        pentagon()
    }

    /* side panel */ 

    document.getElementById("directed-edges-input").checked = game.graph.directed
    document.getElementById("directed-edges-input").onchange = (e) => {
        game.graph.directed = e.target.checked
    }

    document.getElementById("select-mst-kruskal-button").onclick = () => {
        game.graph.clearSelections()
        let cost = mstKruskal(game.graph)
        console.log("MST Cost:", cost)
    }

    document.getElementById("select-mst-prim-button").onclick = () => {
        game.graph.clearSelections()
        let cost = mstPrim(game.graph)
        console.log("MST Cost:", cost)
    }
    
    document.getElementById("color-refinement-button").onclick = () => {
        game.graph.clearSelections()
        colorRefinementStep(game.graph)
    }
    
    document.getElementById("random-coloring-button").onclick = () => {
        game.graph.clearSelections()
        randomlyColorNodes(game.graph)
    }

    document.getElementById("has-cycle-button").onclick = () => {
        let hasCycle
        if (game.graph.directed) {
            hasCycle = hasCycleDirected(game.graph.edges)
        } else {
            hasCycle = hasCycleUndirected(game.graph.edges)
        }

        let result = hasCycle
            ? '<span style="color: green">Yes!</span>'
            : '<span style="color: red">No!</span>'

        document.getElementById("has-cycle-button").innerHTML = "Has Cycle? " + result
    }

    /* action zone */

    document.getElementById("connect-when-inserting-input").checked = game.connectWhenInserting
    document.getElementById("connect-when-inserting-input").onchange = (e) => {
        game.connectWhenInserting = e.target.checked
    }

    document.getElementById("connect-nodes-button").onclick = () => {
        let selectedNodes = game.graph.nodes.filter(node => node.selected)
        if (selectedNodes.length == 2) {
            let from = selectedNodes[0]
            let to = selectedNodes[1]

            if (!game.graph.edges.some(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) {
                game.graph.edges.push(new Edge(from, to))
            }
        }
    }

    /* init */

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth * 2
        canvas.height = window.innerHeight * 2
        clampTransforms()
    })

    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2

    triangle()

    requestAnimationFrame((timestamp) => {
        lastTime = timestamp / 1000
        requestAnimationFrame(loop)
    })
}

init()