'use strict'
const cbor = require('cbor-js')
const toAb = require('to-array-buffer')
const abToB = require('arraybuffer-to-buffer')
const multihashing = require('multihashing')
const bs58 = require('bs58')
const CuckooFilter = require('cuckoo-filter').CuckooFilter
let _value = new WeakMap()
let _transitions = new WeakMap()
let _parent = new WeakMap()
let _final = new WeakMap()
let _hash = new WeakMap()
let _key = new WeakMap()
module.exports= class State{
  constructor(value, parent, final){
    if(!final){
      final = new CuckooFilter(200000,4,8)
    }
    _value.set(this, value)
    _parent.set(this, parent)
    _final.set(this, parent)
    _transitions.set(this, [])
  }
  get key (){
    let key = _key.get(this)
    if (key) {
      return key
    } else {
      key = bs58.encode(this.hash)
      _key.set(this, key)
      return key
    }
    return _key.get(this)
  }
  get value(){
    let value =_value.get(this)
    return value
  }
  get hash(){
    let hash = _hash.get(this)
    if (hash) {
      return hash.slice(0)
    } else {
      hash = multihashing(abToB(cbor.encode(this.toJSON().value)), 'sha2-256')
      _hash.set(this, hash)
      return hash.slice(0)
    }
  }
  get final(){
    let final = _final.get(this)
    return final.contains(this.hash)
  }
  toJSON(){
    let value = _value.get(this)
    let parent = _parent.get(this)
    let transitions = _transitions.get(this)
    let obj={
      value: value,
      parent: parent
    }
    let state={
      value : obj,
      transitions : transitions
    }
    return state
  }
  toCBOR(){
   return abToB(cbor.encode(this.toJSON()))
  }
  markFinal(){
    let final = _final.get(this)
    final.add(this.hash)
  }
  addTransition(value){
    let final = _final.get(this)
    let transitions = _transitions.get(this)
    let found = transitions.find((state)=>{return state.value === value})
    if(found){return found}
    let state = new State(value, this.key, final)
    transitions.push(state)
    return state
  }
}
