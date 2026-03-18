function hasCycle(edges) {
    return false
}

function mstKruskal(graph) {
    edges = graph.edges.sort((a, b) => a.weight > b.weight)
    selectedEdges = []
    cost = 0

    while (selectedEdges.length < graph.nodes.length - 1) {
        let edge = edges[0]
        selectedEdges.push(edge)
        edges = edges.slice(1)

        if (hasCycle(selectedEdges)) {
            selectedEdges.pop()
        } else {
            cost += edge.weight
        }
    }

    for (let edge of selectedEdges) {
        edge.selected = true
    }
}

function colorRefinement(graph) {
    console.log("not implemented yet")
    alert("not implemented yet")
}

function randomlyColorNodes(graph) {
    for (let node of graph.nodes) {
        node.color = `#${Math.floor(Math.random() * 0xFFFFFF)
            .toString(16)
            .padStart(6, "0")}`;
    }
}