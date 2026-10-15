import test from "node:test";
import assert from "node:assert/strict";
import { encodeChoices,decodeChoices } from "../docs/share.mjs";
test("share roundtrip preserves selected preferences without personal details",()=>{
 const source={goal:"light",budget:39,calories:800,protein:40,excludeIds:["f","a"]};
 const encoded=encodeChoices(source);const decoded=decodeChoices(encoded,["a","f","c"]);
 assert.deepEqual(decoded,{...source,excludeIds:["a","f"]});
 assert.equal(/token|email|idNumber/i.test(encoded),false);
});
test("invalid values and unknown ids never reach the interface",()=>{
 const x=decodeChoices("m=<script>&b=Infinity&c=-100000&p=999999&x=../../,%3Cimg%3E,a,a",["a"]);
 assert.deepEqual(x,{goal:"balanced",budget:45,calories:250,protein:70,excludeIds:["a"]});
});
test("normalizes budget and calorie steps",()=>{
 assert.equal(decodeChoices("m=save&b=31.4&c=777&p=33").calories,800);
 assert.equal(decodeChoices("m=save&b=31.4&c=777&p=33").protein,35);
});
