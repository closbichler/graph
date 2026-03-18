function getRandomColor() {
    return `#${Math.floor(Math.random() * 0xFFFFFF)
        .toString(16)
        .padStart(6, "0")}`;
}

function hasCycleUndirected(edges, node = null, visited = new Set()) {
    if (node === null) node = edges[0].from
    if (visited.has(node)) return true
    visited.add(node)

    let nextEdges = edges.filter(e => e.from === node || e.to === node)

    for (let edge of nextEdges) {
        let nextEdges = edges.filter(e => e !== edge)
        let nextNode = edge.from === node ? edge.to : edge.from
        let nextVisited = visited
        if (hasCycleUndirected(nextEdges, nextNode, nextVisited)) return true
    }

    return false
}

function hasCycleDirected(edges, node = null, visited = new Set(), recStack = new Set()) {
    return false
}

function mstKruskal(graph) {
    let edges = graph.edges.sort((a, b) => a.weight - b.weight)
    let selectedEdges = []
    let cost = 0

    while (selectedEdges.length < graph.nodes.length - 1 && edges.length > 0) {
        let edge = edges[0]
        edges = edges.slice(1)

        if (!hasCycleUndirected([...selectedEdges, edge])) {
            selectedEdges.push(edge)
            cost += edge.weight
        }
    }

    for (let edge of selectedEdges) {
        edge.selected = true
    }

    return cost
}

function mstPrim(graph) {
    let selectedEdges = []
    let selectedNodes = new Set([graph.nodes[0]])
    let cost = 0

    while (selectedEdges.length < graph.nodes.length - 1) {
        let nextEdge = null

        for (let edge of graph.edges) {
            if ((selectedNodes.has(edge.from) && !selectedNodes.has(edge.to)) ||
                (selectedNodes.has(edge.to) && !selectedNodes.has(edge.from))) {
                if (nextEdge === null || edge.weight < nextEdge.weight) {
                    nextEdge = edge
                }
            }
        }

        if (nextEdge === null) break

        selectedEdges.push(nextEdge)
        cost += nextEdge.weight
        selectedNodes.add(nextEdge.from)
        selectedNodes.add(nextEdge.to)
    }

    for (let edge of selectedEdges) {
        edge.selected = true
    }

    return cost
}

function randomlyColorNodes(graph) {
    for (let node of graph.nodes) {
        node.color = getRandomColor()
    }
}

function colorRefinementStep(graph) {
    let newColors = new Map()
    let signatures = []

    for (let node of graph.nodes) {
        let neighborColors = graph.edges
            .filter(e => e.from === node || e.to === node)
            .map(e => (e.from === node ? e.to.color : e.from.color))
            .sort()
            .join(",")

        let signature = `${node.color},${neighborColors}`
        signatures.push({ node, signature })

        if (!newColors.has(signature)) {
            newColors.set(signature, getRandomColor())
        }
    }
    
    for (let { node, signature } of signatures) {
        node.color = newColors.get(signature)
    }
}