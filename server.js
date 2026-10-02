const path=require("path");
const http=require("http");
const express=require("express");
const WebSocket=require("ws");
const app=express();
const server=http.createServer(app);
const wss=new WebSocket.Server({server});
app.use(express.static(__dirname));
app.get("/health",(req,res)=>res.json({ok:true,game:"Brix Attack",players:wss.clients.size}));
const players=new Map();
function broadcast(m,except){const d=JSON.stringify(m);for(const c of wss.clients)if(c.readyState===WebSocket.OPEN&&c!==except)c.send(d)}
wss.on("connection",ws=>{
 const id=Math.random().toString(36).slice(2,10);
 const p={id,name:"Player",x:0,y:0,z:0}; players.set(id,p);
 ws.send(JSON.stringify({type:"welcome",id,players:[...players.values()]}));
 broadcast({type:"playerJoined",player:p},ws);
 ws.on("message",raw=>{try{const m=JSON.parse(raw.toString());
  if(m.type==="hello"){p.name=String(m.name||"Player").slice(0,20);broadcast({type:"playerUpdated",player:p})}
  if(m.type==="move"){p.x=Number(m.x)||0;p.y=Number(m.y)||0;p.z=Number(m.z)||0;broadcast({type:"playerUpdated",player:p},ws)}
  if(m.type==="chat")broadcast({type:"chat",id,name:p.name,text:String(m.text||"").slice(0,200)});
 }catch(e){}});
 ws.on("close",()=>{players.delete(id);broadcast({type:"playerLeft",id})});
});
const port=process.env.PORT||10000;
server.listen(port,"0.0.0.0",()=>console.log("Brix Attack listening on "+port));
