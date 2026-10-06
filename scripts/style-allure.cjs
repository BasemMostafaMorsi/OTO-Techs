const fs = require('node:fs');
const path = require('node:path');
function styleReport(directory='allure-report') {
  const file=path.join(directory,'index.html');
  const css=`.description__text { font-family: Arial,sans-serif; font-size:14px; line-height:1.65; padding:8px 12px; max-width:960px; overflow-wrap:anywhere; }
.description__text p { margin:0 0 16px; }
.description__text strong { font-weight:700; }
.description__text ol { list-style:decimal outside; margin:0 0 16px; padding-left:28px; }
.description__text ul { list-style:disc outside; margin:0 0 16px; padding-left:26px; }
.description__text li { display:list-item; margin:0 0 4px; padding-left:3px; }
.description__text li p { margin:0; }
.description__text p:has(> strong:only-child) { margin-bottom:6px; }
`;
  fs.writeFileSync(path.join(directory,'luxora-bugs.css'),css);
  let content=fs.readFileSync(file,'utf8');
  content=content.replace(/<link id="luxora-bugs-style"[^>]*>/g,'');
  content=content.replace('</head>','<link id="luxora-bugs-style" rel="stylesheet" href="luxora-bugs.css"></head>');
  fs.writeFileSync(file,content);
}
module.exports={styleReport};
if(require.main===module)styleReport();
