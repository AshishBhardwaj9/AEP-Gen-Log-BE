const fs = require("fs");

async function sendData(data) {
  var json = {
    header: {
      schemaRef: {
        id: "https://ns.adobe.com/cognizanttechnologys/schemas/4cf5aede873dfe341d9829d801e5d75f31c9d0628fe5c0fa",
        contentType: "application/vnd.adobe.xed-full+json;version=1.0",
      },
      imsOrgId: "D1D7123F524450A60A490D45@AdobeOrg",
      datasetId: "65552f19c9a6bd28d2a1fc53",
      source: {
        name: "AEP Event Restpoint DS",
      },
    },
    body: {
      xdmMeta: {
        schemaRef: {
          id: "https://ns.adobe.com/cognizanttechnologys/schemas/4cf5aede873dfe341d9829d801e5d75f31c9d0628fe5c0fa",
          contentType: "application/vnd.adobe.xed-full+json;version=1.0",
        },
      },
      xdmEntity: {
        _cognizanttechnologys: {
            ...data
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

  json = JSON.stringify(json);

  //   var xhttp = new XMLHttpRequest();
  //   xhttp.onreadystatechange = function () {
  //     if (this.readyState == 4 && this.status == 200) {
  //       console.log(">>>>> Profile call sent to " + tenantId + ".");
  //       console.log(xhttp.responseText);
  //     }
  //   };
  //   xhttp.open("POST", url, true);
  //   xhttp.setRequestHeader("Content-type", "application/json");
  //   xhttp.send(JSON.stringify(json));

  fetch(
    "https://dcs.adobedc.net/collection/f172b18bb9a14c8c348b611170399dafdfe84f4052125bfd290d1387a5f09a7e",
    {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: json,
    }
  ).then((res) => {
    console.log(res);
  });
}

module.exports = sendData