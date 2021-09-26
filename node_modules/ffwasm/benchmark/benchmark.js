/* globals WebAssembly */
const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const assert = require("assert");
const buildWasmFf = require("../index.js").buildWasmFf;
const bigInt = require("big-integer");
const utils = require("../src/utils");
const { performance } = require("perf_hooks");

const N = 20000000;
async function benchmarkMM(prime) {

    const base = prime.minus(1).divide(2).add(5);

    const memory = new WebAssembly.Memory({initial:20000});
    const i32 = new Uint32Array(memory.buffer);

    const n64 = Math.floor((prime.bitLength() - 1) / 64)+1;
    const R = bigInt.one.shiftLeft(n64*64);
    const RInv = R.modInv(prime);

    const module = new ModuleBuilder();
    module.setMemory(1000);

    buildWasmFf(module, "Fr", prime, true);

    buildTest();

    const code = module.build();

    const wasmModule = await WebAssembly.compile(code);

    const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": memory
        }
    });

    const p1 = addNumber(base);
    const p2 = addNumber(base);

    const t1 = performance.now();
/*
    for (let i=1; i<N; i++) {
        instance.exports.Fr_mul(p1, p1, p2);
    }
*/

    instance.exports.bm(p1, p2, N-1);

    const t2 = performance.now();

    const res = readNumber(p1);
    const res2 = base.modPow(bigInt(N), prime);

    assert.equal(res.toString(), res2.toString() );

    return t2-t1;

    function reserveNumber() {
        const res = i32[0];
        i32[0] += (n64+1)*8;
        return res;
    }

    function addNumber(n) {
        const arr = utils.bigInt2byteArray(prime, n, true);
        const p = reserveNumber();
        for (let i=0; i<arr.length; i++) {
            i32[ (p>>2)+i ] = arr[i];
        }
        return p;
    }

    function readNumber(p) {
        const idx = (p>>2);

        if (i32[idx + 1] & 0x80000000) {
            let res= bigInt(0);
            for (let i=n64*2-1; i>=0; i--) {
                res = res.shiftLeft(32);
                res = res.add(bigInt(i32[idx+2+i]));
            }
            if (i32[idx + 1] & 0x40000000) {
                return fromMontgomery(res);
            } else {
                return res;
            }

        } else {
            if (i32[idx] & 0x80000000) {
                return prime.add( bigInt(i32[idx]).minus(bigInt(0x100000000)) );
            } else {
                return bigInt(i32[idx]);
            }
        }
    }

    function fromMontgomery(n) {
        return n.times(RInv).mod(prime);
    }

    function buildTest() {
        const f = module.addFunction("bm");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addParam("n", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal("i", c.getLocal("n")),
            c.block(c.loop(
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.call("Fr_mul", c.getLocal("pA"), c.getLocal("pA"), c.getLocal("pB")),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );

        module.exportFunction("bm");
    }
}

async function benchmarkMMJs(prime) {

    const base = prime.minus(1).divide(2).add(5);

    let p1 = base;
    const p2 = base;

    const t1 = performance.now();
    for (let i=1; i<N; i++) {
        p1 = p1.times(p2).mod(prime);
    }
    const t2 = performance.now();

    const res = p1;
    const res2 = base.modPow(bigInt(N), prime);

    assert.equal(res.toString(), res2.toString() );

    return t2-t1;
}

async function run() {
    let t;

    t = await benchmarkMM(bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617"));
    console.log("Multiplication bn256r Montgomery Wasm: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");
    t = await benchmarkMMJs(bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617"));
    console.log("Multiplication bn256r JS: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");

    t = await benchmarkMM(bigInt("4002409555221667393417789825735904156556882819939007885332058136124031650490837864442687629129015664037894272559787"));
    console.log("Multiplication bls12-381 Montgomery Wasm: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");
    t = await benchmarkMMJs(bigInt("4002409555221667393417789825735904156556882819939007885332058136124031650490837864442687629129015664037894272559787"));
    console.log("Multiplication bls12-381 JS: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");

    t = await benchmarkMM(bigInt("41898490967918953402344214791240637128170709919953949071783502921025352812571106773058893763790338921418070971888253786114353726529584385201591605722013126468931404347949840543007986327743462853720628051692141265303114721689601"));
    console.log("Multiplication mnt6753 Montgomery Wasm: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");
    t = await benchmarkMMJs(bigInt("41898490967918953402344214791240637128170709919953949071783502921025352812571106773058893763790338921418070971888253786114353726529584385201591605722013126468931404347949840543007986327743462853720628051692141265303114721689601"));
    console.log("Multiplication mnt6753 JS: " + (t/1000) + "s " + (t * 1e6 / N) + "ns per multiplication.");

}

run();



