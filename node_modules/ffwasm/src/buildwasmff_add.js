
module.exports = function (ctx) {

    function buildOp(op) {
        const f = ctx.module.addFunction(ctx.prefix+"_" + op);
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addLocal("r", "i64");
        f.addLocal("overflow", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [  // l1
                    ...ctx.ifLong(c, "pB",
                        [  // l1l2
                            ...ctx.ifMontgomery(c, "pA",
                                [ // l1ml2
                                    ...ctx.ifMontgomery(c, "pB",
                                        [ // l1ml2m
                                            ...ctx.setType(c, "pR", 0xC0),
                                            ...opLL(c, "pR", "pA", "pB")
                                        ],[ // l1ml2n
                                            ...ctx.toMontgomery(c, "pB"),
                                            ...ctx.setType(c, "pR", 0xC0),
                                            ...opLL(c, "pR", "pA", "pB")
                                        ]
                                    )
                                ],[  //l1nl2
                                    ...ctx.ifMontgomery(c, "pB",
                                        [ // l1nl2m
                                            ...ctx.toMontgomery(c, "pA"),
                                            ...ctx.setType(c, "pR", 0xC0),
                                            ...opLL(c, "pR", "pA", "pB")
                                        ],[ // l1nl2n
                                            ...ctx.setType(c, "pR", 0x80),
                                            ...opLL(c, "pR", "pA", "pB")
                                        ]
                                    )
                                ]
                            )
                        ],[  // l1s2
                            ...ctx.ifMontgomery(c, "pA",
                                [   // l1ms2
                                    ...ctx.toMontgomery(c, "pB"),
                                    ...ctx.setType(c, "pR", 0xC0),
                                    ...opLL(c, "pR", "pA", "pB")
                                ],[ // l1ns2
                                    ...ctx.setType(c, "pR", 0x80),
                                    ...opLS(c, "pR", "pA", "pB")
                                ]
                            )
                        ]
                    )
                ],[  // s1
                    ...ctx.ifLong(c, "pB",
                        [  // s1l2
                            ...ctx.ifMontgomery(c, "pB",
                                [   // s1l2m
                                    ...ctx.toMontgomery(c, "pA"),
                                    ...ctx.setType(c, "pR", 0xC0),
                                    ...opLL(c, "pR", "pA", "pB")
                                ],[ // s1l2n
                                    ...ctx.setType(c, "pR", 0x80),
                                    ...opSL(c, "pR", "pA", "pB")
                                ]
                            )
                        ],[  // s1s2
                            ...opSS(c, "pR", "pA", "pB")
                        ]
                    )
                ]
            )
        );

        function opLL(c, rL, aL, bL) {
            return c.call(
                ctx.prefixF + "_" + op,
                c.i32_add(c.getLocal(aL), c.i32_const(8)),
                c.i32_add(c.getLocal(bL), c.i32_const(8)),
                c.i32_add(c.getLocal(rL), c.i32_const(8))
            );
        }

        function opSS(c, rL, aL, bL) {
            return [
                ...c.setLocal(
                    "r",
                    c["i64_"+ op](
                        c.i64_load32_s(
                            c.getLocal(aL)
                        ),
                        c.i64_load32_s(
                            c.getLocal(bL)
                        )
                    )
                ),
                ...c.setLocal(
                    "overflow",
                    c.i64_shr_s(
                        c.getLocal("r"),
                        c.i64_const(31)
                    )
                ),
                ...c.if(
                    c.i32_or(
                        c.i64_eqz(c.getLocal("overflow")),
                        c.i64_eqz(c.i64_add(
                            c.getLocal("overflow"),
                            c.i64_const(1)
                        ))
                    ),
                    [
                        ...c.i64_store32(
                            c.getLocal("pR"),
                            c.getLocal("r")
                        ),
                        ...c.i32_store(
                            c.getLocal("pR"),
                            4,
                            c.i32_const(0)
                        )
                    ],[ // Fix overflow
                        ...ctx.setType(c, "pR", 0x80),
                        ...c.call(
                            ctx.prefix + "_rawCopyS2L",
                            c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                            c.getLocal("r")
                        )

                    ]
                )
            ];
        }

        function opLS(c, rL, aL, bS) {
            return [
                ...c.call(
                    ctx.prefix + "_rawCopyS2L",
                    c.i32_const(ctx.pTmp+8),
                    c.i64_load32_s(c.getLocal(bS))
                ),
                ...c.call(
                    ctx.prefixF + "_" + op,
                    c.i32_add(c.getLocal(aL), c.i32_const(8)),
                    c.i32_const(ctx.pTmp+8),
                    c.i32_add(c.getLocal(rL), c.i32_const(8)),
                )
            ];
        }

        function opSL(c, rL, aS, bL) {
            return [
                ...c.call(
                    ctx.prefix + "_rawCopyS2L",
                    c.i32_const(ctx.pTmp+8),
                    c.i64_load32_s(c.getLocal(aS))
                ),
                ...c.call(
                    ctx.prefixF + "_" + op,
                    c.i32_const(ctx.pTmp+8),
                    c.i32_add(c.getLocal(bL), c.i32_const(8)),
                    c.i32_add(c.getLocal(rL), c.i32_const(8)),
                )
            ];
        }
    }



    buildOp("add");
    buildOp("sub");

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_add");
        ctx.module.exportFunction(ctx.prefix + "_sub");
    }

};
