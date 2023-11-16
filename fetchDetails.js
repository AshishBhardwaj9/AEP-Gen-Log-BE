const express=require('express');
const cors=require('cors');

const router=express.Router();

router.use(cors())

let platform_token="";


let platform_client=process.env.PLATFORM_CLIENT
let platform_client_secret=process.env.PLATFORM_CLIENT_SECRET
let platform_client_scope=process.env.PLATFORM_SCOPE

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

router.get('/',async (req,res)=>{
    //var token=req.headers.authorization.split(" ")[1]
    await genPfToken()
    fetch(
        "https://platform.adobe.io/data/foundation/export/datasets/65510fc8468fe728d3b40cf2/preview",
        {
          method: "GET",
          headers: {
            "x-api-key": platform_client,
            Authorization:
              "Bearer "+platform_token,
            "x-gw-ims-org-id": imsOrg,
            "x-sandbox-name": "eas-nonprod-sandbox",
          },
        }
      ).then(async(val) => {
        //console.log(await val.json())
        res.json(await val.json())
    });
})

module.exports= router