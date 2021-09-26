module.exports = function buildCmpOps(ctx) {


    function buildEqR() {
        const f = ctx.module.addFunction(ctx.prefix+"_eqR");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toLong(c, "pB"),
                    ...eqLongAny()
                ],
                ctx.ifLong(c, "pB",
                    [
                        ...ctx.toLong(c, "pA"),
                        ...eqLongAny()
                    ],
                    c.if(
                        c.i32_eq(
                            c.i32_load(c.getLocal("pA")),
                            c.i32_load(c.getLocal("pB"))
                        ),
                        c.ret(c.i32_const(1)),
                        c.ret(c.i32_const(0))
                    )
                )
            ),
            c.i32_const(0)
        );

        function eqLongAny() {
            return ctx.ifMontgomery(c, "pA",
                ctx.ifMontgomery(c, "pB",
                    eqLong(),
                    [
                        ...ctx.toNormal(c, "pA"),
                        ...eqLong()
                    ]
                ),
                ctx.ifMontgomery(c, "pB",
                    [
                        ...ctx.toNormal(c, "pB"),
                        ...eqLong()
                    ],
                    eqLong()
                )
            );
        }

        function eqLong() {
            return c.if(
                c.call(
                    ctx.prefixI + "_eq",
                    c.i32_add(
                        c.getLocal("pA"),
                        c.i32_const(8)
                    ),
                    c.i32_add(
                        c.getLocal("pB"),
                        c.i32_const(8)
                    )
                ),
                c.ret(c.i32_const(1)),
                c.ret(c.i32_const(0))
            );
        }
    }


    function buildGtR() {
        const f = ctx.module.addFunction(ctx.prefix+"_gtR");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toLong(c, "pB"),
                    ...gtLongAny()
                ],
                ctx.ifLong(c, "pB",
                    [
                        ...ctx.toLong(c, "pA"),
                        ...gtLongAny()
                    ],
                    c.if(
                        c.i32_gt_s(
                            c.i32_load(c.getLocal("pA")),
                            c.i32_load(c.getLocal("pB"))
                        ),
                        c.ret(c.i32_const(1)),
                        c.ret(c.i32_const(0))
                    )
                )
            ),
            c.i32_const(0)
        );

        function gtLongAny() {
            return [
                ...ctx.toNormal(c, "pA"),
                ...ctx.toNormal(c, "pB"),

                ...c.if(
                    c.call(
                        ctx.prefix + "_isNegative",
                        c.getLocal("pA")
                    ),
                    c.if(
                        c.call(
                            ctx.prefix + "_isNegative",
                            c.getLocal("pB")
                        ),
                        gtLong(),
                        c.ret(c.i32_const(0))
                    ),
                    c.if(
                        c.call(
                            ctx.prefix + "_isNegative",
                            c.getLocal("pB")
                        ),
                        c.ret(c.i32_const(1)),
                        gtLong()
                    )
                )
            ];
        }


        function gtLong() {
            return c.if(
                c.call(
                    ctx.prefixI + "_gt",
                    c.i32_add(
                        c.getLocal("pA"),
                        c.i32_const(8)
                    ),
                    c.i32_add(
                        c.getLocal("pB"),
                        c.i32_const(8)
                    )
                ),
                c.ret(c.i32_const(1)),
                c.ret(c.i32_const(0))
            );
        }
    }

    function buildEq() {
        const f = ctx.module.addFunction(ctx.prefix+"_eq");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                c.i64_store(c.getLocal("pR"), c.i64_const(0)),
            )
        );
    }

    function buildNeq() {
        const f = ctx.module.addFunction(ctx.prefix+"_neq");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                c.i64_store(c.getLocal("pR"), c.i64_const(1)),
            )
        );
    }

    function buildGt() {
        const f = ctx.module.addFunction(ctx.prefix+"_gt");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                c.if(
                    c.call(
                        ctx.prefix + "_gtR",
                        c.getLocal("pA"),
                        c.getLocal("pB")
                    ),
                    c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                    c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                )
            )
        );
    }


    function buildGeq() {
        const f = ctx.module.addFunction(ctx.prefix+"_geq");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                c.if(
                    c.call(
                        ctx.prefix + "_gtR",
                        c.getLocal("pA"),
                        c.getLocal("pB")
                    ),
                    c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                    c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                )
            )
        );
    }

    function buildLt() {
        const f = ctx.module.addFunction(ctx.prefix+"_lt");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                c.if(
                    c.call(
                        ctx.prefix + "_gtR",
                        c.getLocal("pA"),
                        c.getLocal("pB")
                    ),
                    c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                    c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                )
            )
        );
    }


    function buildLeq() {
        const f = ctx.module.addFunction(ctx.prefix+"_leq");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_eqR",
                    c.getLocal("pA"),
                    c.getLocal("pB")
                ),
                c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                c.if(
                    c.call(
                        ctx.prefix + "_gtR",
                        c.getLocal("pA"),
                        c.getLocal("pB")
                    ),
                    c.i64_store(c.getLocal("pR"), c.i64_const(0)),
                    c.i64_store(c.getLocal("pR"), c.i64_const(1)),
                )
            )
        );
    }

    buildEqR();
    buildGtR();

    buildEq();
    buildNeq();
    buildGt();
    buildGeq();
    buildLt();
    buildLeq();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_eq");
        ctx.module.exportFunction(ctx.prefix + "_neq");
        ctx.module.exportFunction(ctx.prefix + "_lt");
        ctx.module.exportFunction(ctx.prefix + "_leq");
        ctx.module.exportFunction(ctx.prefix + "_geq");
        ctx.module.exportFunction(ctx.prefix + "_gt");
    }

};
