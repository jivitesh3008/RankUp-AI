const text = 'Activity 1. 2 Activity 1. 2 Activity 1. 2 Figure 1. 2Figure 1. 2';
let t = text;
t = t.replace(/(\d+)\.\s+(\d+)/g, '$1.$2');
t = t.replace(/(Activity\s*\d+\.\d+)\s*(Activity\s*\d+\.\d+)+/gi, '$1');
t = t.replace(/(Figure\s*\d+\.\d+)\s*(Figure\s*\d+\.\d+)+/gi, '$1');
console.log(t);
