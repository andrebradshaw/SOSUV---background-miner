Goal: mine the profiles of people who have forked a specific GitHub repository

What do we need?
1) Pull all of the profile paths for those who have forked the repository
2) full profile information for each user

How do we get this information?
1) There is a limit on the number of forks GitHub will display on the page, so we will have to use the GitHub API to get all of this information consistently. 
2) The web page and the basic profile API provide different information, so we need to scrape the HTML as well as make an API call on each profile.

What do technology do we need?
1) due to the need to make multiple requests and due to CORS issues, a Chrome Extension will be best for this project.

Steps:
1) create a manifest file. manifest.json -- keep this name

2) create a content script file. content.js -- this file name isnt important, but it is easy to remember
  
3) create a background script file. getForkers.js -- this file name is not descriptive, but it is what I chose. you can call it background.js if you like, but remember these file names must be listed in the manifest file.

4) Within the content script -- create a function to extract the github repository you wish to scrape and send that information to the background script (getForkers.js)


5) Within the background script -- create a function to listen for messages. chrome.runtime.onMessage.addListener

6) Within your chrome.runtime.onMessage.addListener function -- add the main function you want to run when the message is received from the content script.

7) Now you need all of your scraping functions and when those complete, use the chrome.tabs.sendMessage feature to send that information back to the content script.

8) Within your content script, you now need chrome.runtime.onMessage.addListener to listen for the message from the background script.

9) Within the content script chrome.runtime.onMessage.addListener -- add the functions to download the data you scraped in the background.

10) Now you just save the files and upload them to your browser in dev mode.

