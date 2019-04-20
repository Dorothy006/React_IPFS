import React, { Component } from 'react';
import './App.css';

const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host:'localhost', port : '5001', protocol: 'http'});

function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                      ((char2 & 0x3F) << 6) |
                      ((char3 & 0x3F) << 0));
        break;
    }
  }
  return out;
}
class App extends Component {
   constructor(props){
     super(props);
     this.state={
       strHash: "",
       strContent : "",
       imgSrc : null
     }
   }

   saveToIPFS = (blob) =>{
      return new Promise(function(resolve, reject){
          const descBuffer = Buffer.from(blob,'utf-8');
          //upload data to ipfs core code
          ipfs.add(descBuffer).then((response)=>{
            console.log(response);
            resolve(response[0].hash);
          }).catch((err)=>{
            console.log(err);
            reject(err);
          })
      })
   }

   saveImgToIPFS = (reader) =>{
    return new Promise(function(resolve, reject){
        const buffer = Buffer.from(reader.result);
        //upload image to ipfs core code
        ipfs.add(buffer).then((response)=>{
          console.log(response);
          resolve(response[0].hash);
        }).catch((err)=>{
          console.log(err);
          reject(err);
        })
    })
 }

  render() {
    return (
      <div className="App">
        <div className="forString">
          <br/><br/>
          <label>Enter info here:</label><br></br>
          <input ref="ipfsContent" style={{width:200, height:40}}/><br/><br/>
          <button onClick={()=>{
            let ipfsContent = this.refs.ipfsContent.value;
            console.log(ipfsContent);
            this.saveToIPFS(ipfsContent).then((hash)=>{
              this.setState({
                strHash:hash
              });
            });
          }}>Submit to IPFS</button>

          <p>{this.state.strHash}</p>

          <button onClick={()=>{
            console.log("reading from IPFS");
            ipfs.cat(this.state.strHash).then((stream) => {
              console.log(stream);
              let strContent = Utf8ArrayToStr(stream);
              console.log(strContent);
              this.setState({strContent:strContent });
            });
            
          }}>Get value from IPFS</button>

          <h1>{this.state.strContent}</h1>
        </div>
        <div className="forImg">
          <h2>Choose file to submit</h2>
          <input type="file" ref="file" multiple="multiple"></input>

          <button onClick={()=>{
            var file = this.refs.file.files[0];
            var reader = new FileReader();
            reader.readAsArrayBuffer(file)
            reader.onload=(e) =>{
              console.log(reader);
              this.saveImgToIPFS(reader).then((hash) =>{
                console.log(hash);
                this.setState({imgSrc:hash});
              });
            }
          }}>Submit</button>

          {
            this.state.imgSrc
              ?<div>
                  <h2>{"http://localhost:8080/ipfs/" + this.state.imgSrc}</h2>
                  <img style={{width:500}}
                  src={"http://localhost:8080/ipfs/" + this.state.imgSrc}></img>
                </div>
              :<img alt=""/>
          }
        </div>
      </div>
    );
  }
}

export default App;
