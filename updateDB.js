const express=require('express');
const router=express.Router();

require('dotenv').config()

const sendData=require('./updateRestpoint')

let initUrl = "https://events-va6.adobe.io/events/organizations/19211/integrations/516101/87a874fe-dbb0-4b33-8b07-792d055b6c7b";


let platform_token="";
let web_token="";
let load=[];

let platform_client=process.env.PLATFORM_CLIENT
let platform_client_secret=process.env.PLATFORM_CLIENT_SECRET
let platform_client_scope=process.env.PLATFORM_SCOPE

let journal_client=process.env.JOURNAL_CLIENT
let journal_client_secret=process.env.JOURNAL_CLIENT_SECRET
let journal_client_scope=process.env.JOURNAL_SCOPE
let journal_api_key=process.env.JOURNAL_API_KEY

let grant_type=process.env.GRANT_TYPE
let imsOrg=process.env.IMS_ORG

async function genPfToken(){
    const res= await fetch('https://ims-na1.adobelogin.com/ims/token/v3',{
      method:"POST",
      headers:{
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body :new URLSearchParams({
        'client_id': platform_client,
        'client_secret': platform_client_secret,
        'scope':platform_client_scope,
        'grant_type': grant_type
        })
    })

    platform_token=(await res.json()).access_token
}

async function genDevToken(){
    const res=await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: journal_client,
        client_secret: journal_client_secret,
        scope:journal_client_scope,
        grant_type: grant_type,
      }),
    })

    web_token=(await res.json()).access_token
}

async function getRestpoint(){
    let arr=[];
    let timearr=[];
    var link='';

    await genPfToken()

    const res= await fetch("https://platform.adobe.io/data/foundation/export/datasets/65552f19c9a6bd28d2a1fc53/preview",
         {
           method: "GET",
           headers: { "x-api-key": platform_client,
             Authorization: "Bearer "+platform_token,
             "x-gw-ims-org-id": imsOrg,
             "x-sandbox-name": "eas-nonprod-sandbox",
           },
         }
     )
    let resp=await res.json()
    resp.data.forEach((e)=>{
      //console.log(e)
      if(e['_cognizanttechnologys.link'].length){
        arr.push({processtime:e['_cognizanttechnologys.processtime'],link:e['_cognizanttechnologys.link'],payload:e['_cognizanttechnologys.payload']})
      }
    })
    arr.forEach(e=>{
      timearr.push(parseInt(e.processtime))
    })
    timearr.sort();
    arr.forEach(e=>{
      if(parseInt(e.processtime)==timearr[timearr.length-1]){
          link=e.link.split("?")[1].split(">")[0]
      }
    })
    //return (arr)
    return link;
}

async function getJournalPayload(res) {
    let retVal;
    let status=res.status
    if(res.status==200){
        let resp=await res.json();
        let payload= resp.events[0].event["xdm:eventCode"]=='ing_load_failure'?JSON.stringify(resp):'';
        let processtime=Date.now();
        res.headers.get("link").split(",").forEach(
            (e) => {
             if (e.indexOf("next") > -1) {
                //console.log({status,timestamp,link:e, payload} )
                //return {status,timestamp,link:e, payload}               
                retVal={status,processtime,link:e, payload}
                //return {status,timestamp,link:e, payload}               
                }
            }
        );
    }
    
    return retVal;
}

async function getJournal(sent_url){
    let res = await fetch(sent_url, {
        headers: {
          "Content-Type": "application/json",
          "x-ims-org-id": imsOrg,
          "x-api-key": journal_api_key,
          Authorization:"Bearer "+web_token,
        },
    });
    return (res)
}

async function journalExec(url){
    let journalPayload=[]

    async function check(url){
        let val=await getJournal(url);
        //console.log(await val.json());

        console.log(val)

        let refineVal=await getJournalPayload(val);
        console.log(refineVal)

        if(refineVal && refineVal.status==200){
            //console.log("Journeypayload link: "+refineVal.link);
            journalPayload.push(refineVal);
            try {
                await check(initUrl+"?"+refineVal.link.split("?")[1].split(">")[0])
            } catch (error) {
                console.log(error)
            }
            
        }
        if(refineVal && refineVal.status==204){
            console.log("Reached end of journal");
        }
        
    }
    console.log("Journeypayload final length: "+journalPayload.length);
    console.log("INIT FETCH URL: "+url);

    await check(url)
    return journalPayload;
}

async function enrichPayload(batchId,imsOrg,sandBox){
    console.log("Enriching.....")
    var headers = {
        "Content-Type": "application/json",
        Authorization:
          "Bearer "+platform_token,
        "x-gw-ims-org-id": imsOrg,
        "x-sandbox-name": sandBox,
        "x-api-key": platform_client,
    };
    var res=await fetch("https://platform.adobe.io/data/foundation/catalog/batch/" +batchId,{headers})
    var resp=await res.json();
    //console.log(resp);
    return resp;
}


async function uploadDataDS(json) {
    var json = {
      header: {
        schemaRef: {
          id: "https://ns.adobe.com/cognizanttechnologys/schemas/14c0e419ee9c75fa2bedbb75ba13d7231aed0ce847adc66c",
          contentType: "application/vnd.adobe.xed-full+json;version=1.0",
        },
        imsOrgId: "D1D7123F524450A60A490D45@AdobeOrg",
        datasetId: "65510fc8468fe728d3b40cf2",
        source: {
          name: "AEP Event Logs DS",
        },
      },
      body: {
        xdmMeta: {
          schemaRef: {
            id: "https://ns.adobe.com/cognizanttechnologys/schemas/14c0e419ee9c75fa2bedbb75ba13d7231aed0ce847adc66c",
            contentType: "application/vnd.adobe.xed-full+json;version=1.0",
          },
        },
        xdmEntity: {
          _cognizanttechnologys: {
            ...json
          },
          _id: "/uri-reference",
          _repo: {
            createDate: "2004-10-23T12:00:00-06:00",
            modifyDate: "2004-10-23T12:00:00-06:00",
          },
          createdByBatchID: "/uri-reference",
          modifiedByBatchID: "/uri-reference",
          personID: "Sample value",
          repositoryCreatedBy: "Sample value",
          repositoryLastModifiedBy: "Sample value",
        },
      },
    };
  
    console.log(json.body.xdmEntity._cognizanttechnologys);
  
    json=JSON.stringify(json)
  
  
    var res=await fetch('https://dcs.adobedc.net/collection/ce10048a48d16d06dd8ab30d1d72194eeb31507e0852f6220dbdbcaa9276e4a6',
    {
      method:"POST",
      headers:{"Content-type":"application/json"},
      body:json
    })
    return res;
  }

async function execute(){
    let enrichedData=[]
    await genPfToken();
    await genDevToken();
    // res.json({platform_token,web_token})
    let link=await getRestpoint()
    let journalPayload=await journalExec(initUrl+"?"+link);
    console.log(journalPayload);

    // journalPayload.forEach(async (e)=>{
    //     await sendData(e);
    // })

    const p=journalPayload.map(async (e)=>{
        return new Promise(async (resolve)=>{
            if(e.payload.length){
                //console.log(e)
                e=JSON.parse(e.payload);
                //console.log(e.payload.events[0].event["xdm:ingestionId"])
                let result=await enrichPayload(e.events[0].event["xdm:ingestionId"],e.events[0].event["xdm:imsOrg"],e.events[0].event["xdm:sandboxName"]);
                if(result.status!=403){
                    result.eventName=e.link
                    enrichedData.push(JSON.stringify(result));
                }
            }
            resolve()
        })
    })
    await Promise.allSettled(p);
    return enrichedData;
}

router.get('/',async (req,res)=>{
    await execute()
    let result=await execute();
    if(result.length){
        await uploadDataDS(result);
    }
    res.status(200).json({
        "message":"connection estd...",
        "payload":result
        
    })
})

module.exports=router