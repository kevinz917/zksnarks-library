
module.exports = function (ctx) {

    function buildMul() {
        const f = ctx.module.addFunction(ctx.prefix+"_mul");
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
                                            ...mulLL(c, "pR", "pA", "pB")
                                        ],[ // l1ml2n
                                            ...ctx.setType(c, "pR", 0x80),
                                            ...mulLL(c, "pR", "pA", "pB")
                                        ]
                                    )
                                ],[  //l1nl2
                                    ...ctx.ifMontgomery(c, "pB",
                                        [ // l1nl2m
                                            ...ctx.setType(c, "pR", 0x80),
                                            ...mulLL(c, "pR", "pA", "pB")
                                        ],[ // l1nl2n
                                            ...ctx.setType(c, "pR", 0xC0),
                                            ...mulLL(c, "pR", "pA", "pB"),
                                            ...mulR3(c, "pR"),
                                        ]
                                    )
                                ]
                            )
                        ],[  // l1s2
                            ...ctx.ifMontgomery(c, "pA",
                                [   // l1ms2
                                    ...ctx.toMontgomery(c, "pB"),
                                    ...ctx.setType(c, "pR", 0xC0),
                                    ...mulLL(c, "pR", "pA", "pB")
                                ],[ // l1ns2
                                    ...ctx.toMontgomery(c, "pB"),
                                    ...ctx.setType(c, "pR", 0x80),
                                    ...mulLL(c, "pR", "pA", "pB")
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
                                    ...mulLL(c, "pR", "pA", "pB")
                                ],[ // s1l2n
                                    ...ctx.toMontgomery(c, "pA"),
                                    ...ctx.setType(c, "pR", 0x80),
                                    ...mulLL(c, "pR", "pA", "pB")
                                ]
                            )
                        ],[  // s1s2
                            ...mulSS(c, "pR", "pA", "pB")
                        ]
                    )
                ]
            )
        );

        function mulLL(c, rL, aL, bL) {
            return c.call(
                ctx.prefixF + "_mul",
                c.i32_add(c.getLocal(aL), c.i32_const(8)),
                c.i32_add(c.getLocal(bL), c.i32_const(8)),
                c.i32_add(c.getLocal(rL), c.i32_const(8))
            );
        }

        function mulSS(c, rL, aL, bL) {
            return [
                ...c.setLocal(
                    "r",
                    c.i64_mul(
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

        function mulR3(c, rL) {
            return [
                ...c.call(
                    ctx.prefixF + "_mul",
                    c.i32_const(ctx.pR3),
                    c.i32_add(c.getLocal(rL), c.i32_const(8)),
                    c.i32_add(c.getLocal(rL), c.i32_const(8))
                )
            ];
        }

    }

    buildMul();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_mul");
    }

};
