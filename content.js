function convert2TsvAndDownload(records, named_file){
    var fileArray = records;
    var tsvReady = (s) => s ? s.replace(/\t|\u0009/g, ' ').replace(/\r|\n/g, '↵').replace(/"/g, "'") : s;
    var unqHsh = (a, o) => a.filter(i => o.hasOwnProperty(i) ? false : (o[i] = true));
    var str = (o) => typeof o == 'object' ? tsvReady(JSON.stringify(o).replace(/\n|\r/g, ' ')) : o;
    var firstLevel = fileArray.map(el => Object.entries(el));
    var header = unqHsh(firstLevel.map(el => el.map(itm => itm[0])).flat(),{});
    var table = [header];
    for (var i = 0; i < firstLevel.length; i++) {
      var arr = [];
      var row = [];
      var record = firstLevel[i];
      for (var s = 0; s < record.length; s++) {
        var record_kv = record[s];
        var col_key = record_kv[0];      
        var place = header.indexOf(col_key);
        arr[place] = record_kv[1];
      }
      for (var a = 0; a < arr.length; a++) {
        if (arr[a]) {
          row.push(arr[a]);
        } else {
          row.push('');
        }
      }
      table.push(row);
    }
    function downloadr(arr2D, filename) {
      var data = /\.json$|.js$/.test(filename) ? JSON.stringify(arr2D) : arr2D.map(el => el.reduce((a, b) => a + '\t' + b)).reduce((a, b) => a + '\r' + b);
      var type = /\.json$|.js$/.test(filename) ? 'data:application/json;charset=utf-8,' : 'data:text/plain;charset=utf-8,';
      var file = new Blob([data], {
        type: type
      });
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
      } else {
        var a = document.createElement('a'),
          url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 10);
      }
    }
    var output_ = table.map(el => el.map(itm => str(itm)));
    downloadr(output_, named_file);
  }

function startBackgroundMiner(){
  var reg = (o, n) => o ? o[n] : '';
  var path = reg(/(?<=https:\/\/github.com\/).+?(?=\/network\/members)/.exec(window.location.href),0); //gets the user/repo path for a repository's forks
  if(path){ //if a valid path is found, send the path to the background script for processing. This also acts as a condition to ensure the script only runs when the user is on a github forks page
    chrome.runtime.sendMessage({path: path})
  }
}
startBackgroundMiner(); // runs the function when the content script is created. This means it will run on any websites which match the content_scripts matches in the manifest.json file


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  convert2TsvAndDownload(msg.forker_profiles, msg.filename)
});
  


