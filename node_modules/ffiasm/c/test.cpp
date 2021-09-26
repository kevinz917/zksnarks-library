#include <stdio.h>
#include "fq.hpp"
#include "curve.hpp"
#include <iostream>

template class Curve<RawFq>;

int main(int argc, char **argv) {

    RawFq F;
    RawFq::Element gx;
    RawFq::Element gy;
    RawFq::Element b;

    F.fromString(gx, "1");
    F.fromString(gy, "2");
    F.fromString(b, "3");
    Curve<RawFq> G1(F.zero, b, gx, gy);

    Curve<RawFq>::Point p;
    G1.add(p, G1.g, G1.g);

    std::cout << G1.toString(p, 16) << std::endl;

    F.inv(b, gy);
    
    std::cout << F.toString(b) << std::endl;

    F.inv(b, b);
    
    std::cout << F.toString(b) << std::endl;


    F.fromString(b, argv[1]);

    RawFq::Scalar s;
    for (int i=0; i<10000000; i++) {
        F.scalarBits(s, b);
    }
    for (int i = s.l-1; i>=0; i--) {
        std::cout << s.v[i];
    }
    std::cout << std::endl;

    for (int i=0; i<1; i++) {
        F.scalarNaf(s, b);
    }
    for (int i = s.l-1; i>=0; i--) {
        std::cout << s.v[i];
    }
    std::cout << std::endl;

/*
    RawFq::Element a;
    RawFq::Element b;
    RawFq::Element c;
    F.fromString(a, "1234");
    F.fromString(b, "5678");

    F.add(c, a, b);

    char *s =F.toString(c);

    printf("Result: %s\n", s);
*/
}