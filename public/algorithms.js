function getRandomColor() {
    return `#${Math.floor(Math.random() * 0xFFFFFF)
        .toString(16)
        .padStart(6, "0")}`;
}

function getAdjacencyMap(edges) {
    let adjacency = new Map()
    for (let edge of edges) {
        if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
        if (!adjacency.has(edge.to))   adjacency.set(edge.to, [])
        adjacency.get(edge.from).push(edge.to)
        adjacency.get(edge.to).push(edge.from)
    }
    return adjacency
}

function dfs(adjacency, current, parent, visited) {
    visited.add(current)

    for (let neighbor of adjacency.get(current)) {
        if (!visited.has(neighbor)) {
            if (dfs(adjacency, neighbor, current, visited)) return true
        } else if (neighbor !== parent) {
            return true
        }
    }

    return false
}

function hasCycleUndirected(edges) {
    if (edges.length === 0) return false

    let adjacency = getAdjacencyMap(edges)
    let visited = new Set()

    for (let startNode of adjacency.keys()) {
        if (!visited.has(startNode)) {
            if (dfs(adjacency, startNode, null, visited)) return true
        }
    }

    return false
}

function hasCycleDirected(edges) {
    alert("Not implemented yet")
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