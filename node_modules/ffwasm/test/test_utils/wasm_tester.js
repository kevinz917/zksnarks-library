/* globals WebAssembly */
const fs = require("fs");
const assert = require("assert");
const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildWasmFf = require("../../index.js").buildWasmFf;
const bigInt = require("big-integer");

module.exports = async function tester(prime, tv) {

    const memory = new WebAssembly.Memory({initial:20000});
    const i32 = new Uint32Array(memory.buffer);

    const module = new ModuleBuilder();
    module.setMemory(1000);

    buildWasmFf(module, "Fr", prime, true);

    const n64 = Math.floor((prime.bitLength() - 1) / 64)+1;
    const R = bigInt.one.shiftLeft(n64*64);
    const RInv = R.modInv(prime);


    const code = module.build();

    const wasmModule = await WebAssembly.compile(code);

    const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": memory
        }
    });


    for (let i=0; i<tv.length; i++) {
        const old0 = i32[0];
        const paramPointers = [];
        for (let j=0; j<tv[i][0].length-1; j++) {
            paramPointers.push(addNumber(tv[i][0][j]));
        }
        const pResult = reserveNumber();

/*
        console.log("IT: "+i);
        for (let j=0; j<tv[i][0].length; j++) {
            console.log(tv[i][0][j]);
        }
        console.log("");
*/
        instance.exports["Fr_"+tv[i][0][tv[i][0].length-1]](pResult, ...paramPointers);
        const res = readNumber(pResult);

        if (res.toString() != tv[i][1].toString()) {
            console.log("FAILED "+i);
            for (let j=0; j<tv[i][0].length; j++) {
                console.log(tv[i][0][j]);
            }
            console.log("Should Return: " + tv[i][1].toString());
            console.log("But Returns: " + res.toString());
        }

        assert.equal(res.toString(), tv[i][1].toString());
        i32[0] = old0;
    }

    function reserveNumber() {
        const res = i32[0];
        i32[0] += (n64+1)*8;
        return res;
    }

    function addNumber(arr) {
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

};
