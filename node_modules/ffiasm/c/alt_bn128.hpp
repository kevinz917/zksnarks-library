#include "../build/fq.hpp"
#include "../build/fr.hpp"
#include "f2field.hpp"
#include "curve.hpp"
#include <string>
namespace AltBn128 {

    typedef RawFq::Element F1Element;
    typedef F2Field<RawFq>::Element F2Element;
    typedef Curve<RawFq>::Point G1Point;
    typedef Curve<RawFq>::PointAffine G1PointAffine;
    typedef Curve< F2Field<RawFq> >::Point G2Point;
    typedef Curve< F2Field<RawFq> >::PointAffine G2PointAffine;

    extern RawFq F1;
    extern F2Field<RawFq> F2;
    extern RawFr Fr;
    extern Curve<RawFq> G1;
    extern Curve< F2Field<RawFq> > G2;

    class Engine {
    public:
        static RawFq &F1;
        static F2Field<RawFq> &F2;
        static RawFr &Fr;
        static Curve<RawFq> &G1;
        static Curve< F2Field<RawFq> > &G2;

        typedef RawFq::Element F1Element;
        typedef F2Field<RawFq>::Element F2Element;
        typedef Curve<RawFq>::Point G1Point;
        typedef Curve<RawFq>::PointAffine G1PointAffine;
        typedef Curve< F2Field<RawFq> >::Point G2Point;
        typedef Curve< F2Field<RawFq> >::PointAffine G2PointAffine;
    };

    extern Engine engine;
}  // Namespace

