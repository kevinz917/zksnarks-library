//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [6424142709954054536517172736711281682840495536617352162609067829215875032504,
             17779414901155063981750262627545733899679757961141155966793017310706988454956],
            [16307585117069934934485639912026961729067108946529310212413465765616998285174,
             19735592338694936203076607534776775646802052741566370041921745849978831796949]
        );
        vk.IC = new Pairing.G1Point[](43);
        
        vk.IC[0] = Pairing.G1Point( 
            16680579238292991698221692128477053187245993777659774534236744239423865996783,
            11458725575406872617591693974004778453438852910619781786076630125356991974351
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            15184431724315907701646756518806726177624106842204630923090294183562296136460,
            2472025180452349457363616275127502212430249340690231157322931242322952558063
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            5920803762603772813914667947769720298527268958148653371628879118643600873762,
            10749124256780817406185419206889504941652679658665342249838167007556776869807
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            3192803182064607622681670649766959828353612465865398837064821076470937097033,
            14939784119735105236071648100774770201768284855529704344375999848612369644986
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            10086424557815129533363057351300672307506654520626683948604415889846326607622,
            9077606294443609014406667317736876066038052642431558533565031561395554286560
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            9778741438566325357254589530841368290760628729906106258277221706643944493930,
            5829414164161769013803447469194697757274308218653280916999840164300103816575
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            6160408266283879943966139352696223761080471557579162565940792810943848738135,
            6908474695011145772365004313504536940801133736455681238604993983460814690374
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            18087799805157429063390173748639693473002393748601431735186953267565128925736,
            8615922545269418494921608543061697226289346510273141986097640629068228850791
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            7671091641388755276883339339122249486668580707457665553173971043278510467500,
            14471957985215847277609047473829271598992628507079748809791318410336093637279
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            6538964029527255936448894861189364862688923322070176104368310175499689599589,
            13294889478052190857172429700612972974287437564383998274238293849226801555877
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            8676924347953474232213492320823984256493311740833786351103385031808183937287,
            14816652483646626031264754822733728200434050952241449844207214288636044574242
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            6384784107325686087088123557369088022805616244832314749099951658561893079854,
            13557416422131810330642839183960752574569894263092477143276277264991482672998
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            16588060369004631606161623434071575934104684228085618482611401736447918843251,
            10535079166795815373500646524475954113146820758913276616535842822167789067485
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            2047617330335219257622081439288598761887993622609211985424435581693638132305,
            8413413547994062700781625291333692405050608574475160719849414696220006850416
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            20939963721826536308968126286380355879648255000312655753559087466790277681832,
            6794564230746985018742122196588163541317809755612051105052319866992107739526
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            10748415847739976901177919985626007361807825143538610232442479135068669819771,
            20320625188161778081423641445823903584282549277930459756840123559925391430367
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            9434967175734013819352076220587773655438430149423022465420864977134720568784,
            18784228588112862917577996379124157605750070784057392853507105792541502312606
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            5184186856193752351021653168956237557375574319973658137047827193931402834084,
            18523030656262345213635292120430304668522523387158753299689250120623920427738
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            8146381720979432029488548124409850505940951900046110488054735456693021224970,
            6482741620095817910484820897790045146139639368015756298367756454726790975255
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            652158970012032316585841875780156681960637749902333775361631320546738856097,
            4521561632483582661541445665674378575186916457141022922323714176451307226586
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            8074027695552030144194797153386238020124188848776819320770729029186721070166,
            19646498777661943799091679837379267761590146598089936609347879597503539479559
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            16043429813551255834677136804793189810996190578946315765317877025813534936374,
            17156112691516200274571521936278716352693912415975973247903310910870000263196
        );                                      
        
        vk.IC[22] = Pairing.G1Point( 
            8366981626949586252176980223917490109878470979875505840726464900522577981582,
            13817890122498574297680086262853946796824031830695606248595121955165186334416
        );                                      
        
        vk.IC[23] = Pairing.G1Point( 
            7161176084709189653403475573228918653423553529697611018808451591170860994742,
            4200952507462217372525899820345402303245266423945175368980328519839209769363
        );                                      
        
        vk.IC[24] = Pairing.G1Point( 
            7437800751643664560370490367977886303989259849443119084783424620056512439444,
            6133609021665965399041209214014405567148527092953481614610436901788989292810
        );                                      
        
        vk.IC[25] = Pairing.G1Point( 
            2177417394004207862637079268844573082961166896001470988354615219132256169380,
            20280391533712993479873994165226430302251238678546573902143987014571821918782
        );                                      
        
        vk.IC[26] = Pairing.G1Point( 
            17054709316522668107277421269829246467606609855417411740463560049708555369708,
            4285258279958845286674901757247016133533207065467403791962684751416239578461
        );                                      
        
        vk.IC[27] = Pairing.G1Point( 
            17872391856217381573836853811014848231093321218444648872731815435531264795272,
            8601415769279008261137159524573352252165370724036140905666007246802625361078
        );                                      
        
        vk.IC[28] = Pairing.G1Point( 
            7612841389971275283728965130161633715418900185994085154319486143526834668833,
            11309808633874271964297846526534018320028511992535875305914835195169344875787
        );                                      
        
        vk.IC[29] = Pairing.G1Point( 
            16335906953578412871608439072580926712365812659299044716968464890320487428343,
            9180990406186884966282405039884917903868812193698166854935722588225454313066
        );                                      
        
        vk.IC[30] = Pairing.G1Point( 
            6746694465668560284895323058529974295383496120033227284309814127519166134414,
            17623445683522764522260741822712317674006565290107739884005389048919175186647
        );                                      
        
        vk.IC[31] = Pairing.G1Point( 
            16790234356514897300370351029466548338848745455927836005861345775404085895427,
            13052193561438260060289432637244644881957736085130719532635405155952179284461
        );                                      
        
        vk.IC[32] = Pairing.G1Point( 
            6587776982942769805849815891306915071841796974330334026738758981418096028702,
            2622325932736372252008621779621631853344418138980551670103753395641677116135
        );                                      
        
        vk.IC[33] = Pairing.G1Point( 
            9936953987640350617749158674170779385234561975141091135223590194878577903898,
            106288434825060324015854009062611340309440360952568166111249803816347812866
        );                                      
        
        vk.IC[34] = Pairing.G1Point( 
            19247558314527956942264619543916235428793005415981405413267903584672851151141,
            530654384923117399572109055284730801043238503474300077872073923354635499728
        );                                      
        
        vk.IC[35] = Pairing.G1Point( 
            14348855211331386999191537576903001499591273773751699202828885147558474605040,
            15790017638552017357348943609396911640742304673891889239695523849867950526883
        );                                      
        
        vk.IC[36] = Pairing.G1Point( 
            5566075589638928933004213751072367963121993970814121088932232084287803285987,
            2917910808084616396231088175158677286531267225465459510021741040183633681322
        );                                      
        
        vk.IC[37] = Pairing.G1Point( 
            15180301892754263196611547744104923110807509704600235363929522440721267982473,
            20077007114408067863792340114003498392051604126331563645090013036430673151860
        );                                      
        
        vk.IC[38] = Pairing.G1Point( 
            6854563053357434986934878252562862853857931848851005412753338702041842656309,
            16412831490690315718169504874225586312471109736461342033003763616216628841601
        );                                      
        
        vk.IC[39] = Pairing.G1Point( 
            1948350933558505689205876824019516895889892875017070436938456357399436555494,
            13011256838180539263590875456877601228562665721176437728187501544060729214965
        );                                      
        
        vk.IC[40] = Pairing.G1Point( 
            4336899985703380047436670110314115227430651194186640341359056905152544826715,
            5487329993554013906464168764803660621616942729193254990799899701178324590135
        );                                      
        
        vk.IC[41] = Pairing.G1Point( 
            11851019673893038753034316342143987913017939145612864231812576138568949726917,
            2997145113679256407852138829611226694922666053127998039864701047004187256124
        );                                      
        
        vk.IC[42] = Pairing.G1Point( 
            5330610939732678337139117527087574041301016068468335384600844105010090863126,
            4977865866412811170168167015333420589626957175815460088095567256362066251046
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[42] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
