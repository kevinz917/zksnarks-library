



module.exports = function (ctx) {

    function buildOp(op) {
        const f = ctx.module.addFunction(ctx.prefix+"_l" + op);
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c["i32_" + op](
                    c.call(
                        ctx.prefix + "_isTrue",
                        c.getLocal("pA")
                    ),
                    c.call(
                        ctx.prefix + "_isTrue",
                        c.getLocal("pB")
                    )
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                c.i64_store(c.getLocal("pR"), c.i64_const(0))
            )
        );
    }

    function buildNot() {
        const f = ctx.module.addFunction(ctx.prefix+"_lnot");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_isTrue",
                    c.getLocal("pA")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                c.i64_store(c.getLocal("pR"), c.i64_const(1))
            )
        );
    }

    buildOp("and");
    buildOp("or");
    buildNot();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_land");
        ctx.module.exportFunction(ctx.prefix + "_lor");
        ctx.module.exportFunction(ctx.prefix + "_lnot");
    }

};
