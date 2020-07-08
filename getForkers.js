var reg = (o, n) => o ? o[n] : '';
var cn = (o, s) => o ? o.getElementsByClassName(s) : false;
var tn = (o, s) => o ? o.getElementsByTagName(s) : false;
var gi = (o, s) => o ? o.getElementById(s) : false;
var rando = (n) => Math.round(Math.random() * n);

var delay = (ms) => new Promise(res => setTimeout(res, ms));
var ele = (t) => document.createElement(t); //shorthand to create a new element.
var attr = (o, k, v) => o.setAttribute(k, v); //this is shorthand to assign an attribute key value pair to an element
var a = (l, r) => r.forEach(a => attr(l, a[0], a[1])); //this is used to assign an array of attributes to an element

var reChar = (s) => s.match(/&#.+?;/g) && s.match(/&#.+?;/g).length > 0 ? s.match(/&#.+?;/g).map(el=> [el,String.fromCharCode(/d+/.exec(el)[0])]).map(m=> s = s.replace(new RegExp(m[0], 'i'), m[1])).pop() : s;

var unqHsh = (a, o) => a.filter(i => o.hasOwnProperty(i) ? false : (o[i] = true)); // takes an array and returns a unique set. arguments are (array,{}). needs an empty object passed as the second argument. 

var fixNameCase = (s) => s.split(/(?=[^áàâäãåÁÀÂÄÃæéèêëÉÈÊËíìîïñÑóòôöõøœÓÒÔÖÕØŒßÚÙÛÜúùûüa-zA-Z])\b/).map(el=> el.replace(/\w\S*/g, txt=> txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())).join('').replace(/(?<=\bMc)\w/ig, t=> t.charAt(0).toUpperCase());

//this splits a full name into first and last and returns it as an object
var nameSplitter = (s) => s ? {first_name: reg(/^\S+/.exec(s),0), last_name: reg(/(?<=\s+).+/.exec(s),0)} : {};

//cleanObject is a variable function that cleans up an object. Removing any null, undefined or empty objects, empty arrays, or empty strings. We need this instead of just looking for a true value because 0, negative numbers are false, and empty objects/arrays are true.
var cleanObject = (ob) => 
  Object.entries(ob).reduce((r, [k, v]) => {
    if(v != null && v != undefined && v != "" && ( typeof v == 'boolean' || typeof v == 'string' || typeof v == 'symbol' || typeof v == 'number' || typeof v == 'function' || (typeof v == 'object'  && ((Array.isArray(v) && v.length) || (Array.isArray(v) != true)) ) ) ) { 
      r[k] = v; 
      return r;
    } else { 
     return r; 
    }
  }, {});

async function handleFetch(url,params_obj,type){ //all arguments are required
    if(params_obj && url){
      var res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return false });
      if(res.status > 199 && res.status < 300){
        if(type == 'json'){
          var d = await res.json().catch(err=> { console.log([err,url,params_obj]); return false });
        }else{
          var d = await res.text().catch(err=> { console.log([err,url,params_obj]); return false });  
        }
        return d;
      }
      if(res.status == 429) {
        await delay(140000);
        var res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return {} });
        if(res.status > 199 && res.status < 300){
          if(type == 'json'){
            var d = await res.json().catch(err=> { console.log([err,url,params_obj]); return false });
          }else{
            var d = await res.text().catch(err=> { console.log([err,url,params_obj]); return false });  
          }
          return d;
        }else{
          return {download_now: true, status: res.status};
        }
      }
      if(res.status > 499 && res.status < 900) {
        await delay(3110);
        var res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return false });
        if(res.status > 199 && res.status < 300){
          if(type == 'json'){
            var d = await res.json().catch(err=> { console.log([err,url,params_obj]); return false });
          }else{
            var d = await res.text().catch(err=> { console.log([err,url,params_obj]); return false });  
          }
          return d;
        }else{
          return {download_now: true, status: res.status};
        }
      }
      if(res.status > 899) {
        console.log('you have been logged out');
        return {download_now: true, status: res.status};
      }
    } else {return false;}
}


async function githubProfileObjectDOM(path) {
  var attrFilter = (arr, str, prop) => unqHsh(arr.filter(el => el.getAttribute(prop) == str).map(el => el ? el.innerText.trim() : '').filter(r=> r),{}); //this is used for identifying the elements containing the target attribute names we wish to scrape.
  var text = await handleFetch(`https://github.com/${path}?tab=repositories`,{},'text'); 
  if(text && typeof text == 'string'){
    var doc = new DOMParser().parseFromString(text, 'text/html'); 
    var all = Array.from(doc.querySelectorAll('*'));  
    var items = [
        ['additionalName','additional_name'],
        ['name','full_name'],
        ['homeLocation','location'],
        ['worksFor','employer'],
        ['url','url'],
        ['email','email'],
        ['programmingLanguage','language']
    ];
    var obj = {};
    items.forEach(r=> {
        var val = attrFilter(all, r[0], 'itemprop');
        if(val.length) obj[r[1]] = val[0]; 
    });
    obj['profile_path'] = path;
    return obj;
  }
}

async function getGithubProfileDataDOM(path){
    var profile = await githubProfileObjectDOM(path);
    var obj = {...profile,...nameSplitter( profile.full_name ? fixNameCase(profile.full_name) : false)}; 
    //obj variable is using the spread syntax. This is a quick way to merge objects of the same type. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    obj['domain'] = 'github';
    obj['url'] = `github.com/${obj.profile_path}`;
    return obj;
}

async function getForksByPage(path,page){
  var d = await handleFetch(`https://api.github.com/repos/${path}/forks?page=${page}&per_page=100`,{},'json'); //https://developer.github.com/v3/
  return d && d.download_now != true && d.length ? d.map(r=> r.owner.login) : false;
}

async function loopThroughForks(path){
  var number_of_forks = 5000;               //arbitrary, we will close the loop if the returned request is false; 
  var pages = ((number_of_forks/100)+1);
  var usernames = [];
  for(var i=1; i<pages; i++){
    var res = await getForksByPage(path,i); // i is the page argument within the other function.
    await delay(rando(1000)+1111);          //this helps ensure we do not get a 429 error from spamming the server.
    if(res && res.download_now != true){
      res.forEach(r=> usernames.push(r))
    }else{
      break;                                // stops the loop.
    }
    console.log(usernames);
  }
  return usernames;
}

async function githubProfileObjectAPI(obj){
  var d = await handleFetch(`https://api.github.com/users/${obj.profile_path}`,{},'json');      //https://developer.github.com/v3/
  if(d && d.download_now != true ){
    var langs = await gitHubLangsAPI(obj);
    var profile = cleanObject({...trimAPIObject((d ? d : {})),...obj,...{languages: langs}}); 
    return profile;
  }else{
    return obj;
  }
}

async function gitHubLangsAPI(obj){
  var d = await handleFetch(`https://api.github.com/users/${obj.profile_path}/repos?page=1&per_page=100`,{},'json'); //https://developer.github.com/v3/
  if(d && d.download_now != true ){
    var langs = d && d.length ? d.map(r=> r.language).filter(r=> r) : [];
    var weighted_langs = unqHsh(langs,{}).map(r=> r ? {
        lang: r,
        count: langs.filter(l=> l == r).length
    } : {});
    return weighted_langs;
  }else{
    return [];
  }
}

function trimAPIObject(obj){ //this function specifies the speficif key:value pairs we want from the API response. 
  //using the cleanObject function here to ensure we do not overwrite data from the DOM like Email with a null value. This should really be handled by a more complex condition statement, but lets keep this simple for now.
  return cleanObject({
    bio: obj.bio,
    twitter_username: obj.twitter_username,
    followers: obj.followers,
    following: obj.following,
    created_at: obj.created_at,
    updated_at: obj.updated_at,
    public_repos: obj.public_repos,
    public_gists: obj.public_gists,
    hireable: obj.hireable,
    company: obj.company,
    email: obj.email,
    blog: obj.blog,
  })
}

async function loopThroughForkerProfiles(arr){
  var profiles = [];
  for(var i=0; i<arr.length; i++){
    var dom_obj = await getGithubProfileDataDOM(arr[i]);
    if(dom_obj && dom_obj.download_now != true){
      var full_obj = await githubProfileObjectAPI(dom_obj);
      profiles.push(full_obj);
      await delay(rando(1111)+1111);
    }else{
      break;
    }
  }
  return profiles;
}

async function getForkerProfileObjects(path,sender){
  var forkers = await loopThroughForks(path);
  var forker_profiles = await loopThroughForkerProfiles(forkers);
  var filename = `${path.replace(/\W+/g,'_')}.tsv`; //change ".tsv" to ".json" if you want the JSON format instead of a table.
  chrome.tabs.sendMessage(sender.tab.id, {forker_profiles:forker_profiles,filename:filename});
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg.path){
    console.log(sender);
    getForkerProfileObjects(msg.path,sender);
  }
}) //https://developer.chrome.com/extensions/messaging
  
