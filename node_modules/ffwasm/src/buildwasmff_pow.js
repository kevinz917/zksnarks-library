
module.exports = function (ctx) {

    function buildPow() {
        const f = ctx.module.addFunction(ctx.prefix+"_pow");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.toMontgomery(c, "pA"),
            ctx.toLong(c, "pB"),
            ctx.toNormal(c, "pB"),
            ctx.setType(c, "pR", 0xC0),
            c.call(
                ctx.prefixF + "_exp",
                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                c.i32_add(c.getLocal("pB"), c.i32_const(8)),
                c.i32_const(ctx.n64*8),
                c.i32_add(c.getLocal("pR"), c.i32_const(8))
            )
        );
    }

    buildPow();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_pow");
    }

};
