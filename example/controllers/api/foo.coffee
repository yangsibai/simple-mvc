exports.bar = (req, res)->
    res.send new Date()

exports.err = (req, res)->
    throw new Error("test error")

exports.view = (req, res)->
    res.render "view",
        title: "test view"
