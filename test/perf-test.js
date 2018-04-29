var benchmark = require('benchmark');
var suite = new benchmark.Suite;

// suite.add('RegExp#test', function() {
//   /o/.test('Hello World!');
// })
// .add('String#indexOf', function() {
//   'Hello World!'.indexOf('o') > -1;
// })
// .add('String#match', function() {
//   !!'Hello World!'.match(/o/);
// })
// // add listeners
// .on('cycle', function(event) {
//   console.log(String(event.target));
// })
// .on('complete', function() {
//   console.log('Fastest is ' + this.filter('fastest').map('name'));
// })

suite.add('test1', function(){
    for(let i = 0; i < 100; i ++){
        console.log(i);
    }
    suite.emit('complete');
})
.on('start', function(){
    console.log("test started.");
})
.on('complete', function(){
    console.log("test completed.");
})

// suite.run({'async':true});
