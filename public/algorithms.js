function mst(graph) {
    console.log("not implemented yet")
    alert("not implemented yet")
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