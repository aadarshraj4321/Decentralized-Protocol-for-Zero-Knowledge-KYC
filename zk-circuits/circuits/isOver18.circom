pragma circom 2.1.5;

// This path is correct because the compile script uses the `-l ./node_modules` flag
include "circomlib/circuits/comparators.circom";

template isOver18() {
    signal input birthYear;
    signal input currentYear;
    
    // We want to prove: currentYear - birthYear >= 18
    // This is the same as: currentYear > birthYear + 17
    
    component gt = GreaterThan(252);
    
    gt.in[0] <== currentYear;
    gt.in[1] <== birthYear + 17;

    // We constrain the output of the comparator to be 1 (true)
    gt.out === 1;
}

component main {public [currentYear]} = isOver18();