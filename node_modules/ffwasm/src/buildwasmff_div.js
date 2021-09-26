
module.exports = function (ctx) {

    function buildIDiv() {
        const f = ctx.module.addFunction(ctx.prefix+"_idiv");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.toLong(c, "pA"),
            ctx.toNormal(c, "pA"),
            ctx.toLong(c, "pB"),
            ctx.toNormal(c, "pB"),
            ctx.setType(c, "pR", 0x80),
            c.call(
                ctx.prefixI + "_div",
                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                c.i32_add(c.getLocal("pB"), c.i32_const(8)),
                c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                c.i32_const(ctx.pTmp+8)
            )
        );
    }

    function buildMod() {
        const f = ctx.module.addFunction(ctx.prefix+"_mod");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.toLong(c, "pA"),
            ctx.toNormal(c, "pA"),
            ctx.toLong(c, "pB"),
            ctx.toNormal(c, "pB"),
            ctx.setType(c, "pR", 0x80),
            c.call(
                ctx.prefixI + "_div",
                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                c.i32_add(c.getLocal("pB"), c.i32_const(8)),
                c.i32_const(ctx.pTmp+8),
                c.i32_add(c.getLocal("pR"), c.i32_const(8))
            )
        );
    }

    function buildInv() {
        const f = ctx.module.addFunction(ctx.prefix+"_inv");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.toLong(c, "pA"),
            c.call(
                ctx.prefixI + "_inverseMod",
                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                c.i32_const(ctx.pPrime),
                c.i32_add(c.getLocal("pR"), c.i32_const(8))
            ),
            ctx.ifMontgomery(c, "pA",
                [
                    ...ctx.setType(c, "pR", 0xC0),
                    ...c.call(
                        ctx.prefixF + "_mul",
                        c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                        c.i32_const(ctx.pR3),
                        c.i32_add(c.getLocal("pR"), c.i32_const(8))
                    )
                ],
                ctx.setType(c, "pR", 0x80),
            )
        );
    }

    function buildDiv() {
        const f = ctx.module.addFunction(ctx.prefix+"_div");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addLocal("r", "i64");
        f.addLocal("overflow", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(
                ctx.prefix + "_inv",
                c.getLocal("pR"),
                c.getLocal("pB"),
            ),
            c.call(
                ctx.prefix + "_mul",
                c.getLocal("pR"),
                c.getLocal("pR"),
                c.getLocal("pA"),
            )
        );
    }

    buildIDiv();
    buildMod();
    buildInv();
    buildDiv();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_idiv");
        ctx.module.exportFunction(ctx.prefix + "_mod");
        ctx.module.exportFunction(ctx.prefix + "_inv");
        ctx.module.exportFunction(ctx.prefix + "_div");
    }

};
