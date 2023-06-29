export default function chunk(arr, size) {
    let arr2=[];
    for(var i=0;i<arr.length;i= i+size){
        arr2.push(arr.slice(i,i+size));
    }
    return arr2;
}
