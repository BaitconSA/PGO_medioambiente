// @ts-nocheck
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"uimodule/utils/utils",
], function (Controller, Utils) {
	"use strict";

	return {

		_urlCatalog: null,
		_urlDMS: null,
		_urlPdfApi: null,
		_urlUserApi: null,
		_urlWF: null,

		promisizer: function (oOptions) {
			return this.toPromise(jQuery.ajax(oOptions));
		},

		toPromise: function (oPromise) {
			return new Promise(function (resolve, reject) {
				oPromise.then(() => {
					const sHeaders = oPromise.done().getAllResponseHeaders();
					const aHeaders = sHeaders.trim().split(/[\r\n]+/);
					const oHeaderMap = {};
					aHeaders.forEach(function (sLine) {
						const aParts = sLine.split(': ');
						const sHeader = aParts.shift();
						const sValue = aParts.join(': ');
						oHeaderMap[sHeader] = sValue;
					});
					resolve([oPromise.done().responseJSON, oHeaderMap]);
				}, reject);
			});
		},

		callGetService: function (sEntity) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`)
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callPostService: function (sEntity, oPayload) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(oPayload),
				})
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callUpdateService: function (sEntity, oPayload) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(oPayload),
				})
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callDeleteService: function (sEntity) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "DELETE",
				})
					.then((response) => res(response))
					.catch((err) => rej(err));
			});
		},

		createFolderDMS: async function (Obra, Proveedor, P3, PI) {
			const urlPrincipal = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}`;
			const urlRegistros = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra`;
			const respFolderRegistros = await fetch(urlPrincipal, {
			  method: "POST",
			  body: this.getFormDMS(`Registros de obra`),
			});
			const respFolderPH = await fetch(urlRegistros, {
			  method: "POST",
			  body: this.getFormDMS(`Pruebas hidráulicas`),
			});
			const respFolderEnsayos = await fetch(urlRegistros, {
			  method: "POST",
			  body: this.getFormDMS(`Ensayos`),
			});
			return await Promise.all([
			  respFolderRegistros.json(),
			  respFolderPH.json(),
			  respFolderEnsayos.json()
			]);
		  },
	  
		  getFormDMS: function (folder) {
			const oForm = new FormData();
			oForm.append("cmisaction", "createFolder");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", folder);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:folder");
			oForm.append("_charset_", "UTF-8");
			oForm.append("succinct", true);
			return oForm;
		  },
	  
		  postDMSFile: async function (File, Obra, Proveedor, P3, PI, Folder) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Actas/${Folder}/`;
			const oForm = new FormData();
			oForm.append("cmisaction", "createDocument");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", File.name);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:document");
			oForm.append("_charset_", "UTF-8");
			oForm.append("includeAllowableActions", true);
			oForm.append("succinct", true);
			oForm.append("media", File);
			const resp = await fetch(url, {
			  method: "POST",
			  body: oForm,
			});
			return await resp.json();
		  },
	  
		  getFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const image = await fetch(url);
			return await image.blob();
		  },
	  
		  deleteFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const oForm = new FormData();
			oForm.append("cmisAction", "delete");
			await fetch(url, {
			  method: 'POST',
			  body: oForm
			});
		  },
	  
		  getSignedFile: async function (oPayload) {
			const url = `${this._urlDocuSignApi}/DocumentsDocuSign`;
			const oData = await fetch(url, {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify(oPayload),
			});
			return await oData.blob();
		  },
	  
		  createPdf: async function (oPayload) {
			const url = `${this._urlPdfApi}/`;
			const oData = await fetch(url, {
			  method: "POST",
			  headers: {
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify(oPayload)
			});
			return await oData.json();
		  },

		setUrl: function (urlCatalog, _urlWF, ) {
			this._urlCatalog = urlCatalog;	
			this._urlWF = _urlWF;	
        },

		getUser: async function () {
		const url = `${this._urlUserApi}/attributes`;
		const resp = await fetch(url);
		const user = await resp.json();
		return user;
		},

		getUserRoles: function () {
            return this.callGetService("getUserRoles()");
	    },

		getUsuariosEstructuraOrganizativa: function () {
			return this.callGetService(`Personal?$filter=area_ID eq 'MA'`);
		},
		
        // eslint-disable-next-line valid-jsdoc
        /*** FUNCIONES IMPORTANTES ***/
		getObraData: function (ID) {
			/*const expandParams = [
				"p3($expand=fluido,partido,sistema,tipo_contrato,pi(",
				"$expand=sistema_contratacion,responsables,tramos,ensayos($expand=estado),",
				"actas($expand=aprobadores($expand=decision,rol),",
				"acta_sancion($expand=estado,articulos($expand=articulo),documentacion))",
				")),estado,contratista($expand=contratista),",
				"financiamiento_obra,responsables($expand=gerencia)"
			].join(""); */

			const expandParams = [
				"estado,contratista($expand=contratista),p3($expand=fluido,partido,sistema,tipo_contrato,nota_pedido($expand=),pi(",
				"$expand=sistema_contratacion,responsables($expand=responsables($expand=gerencia)),tramos,ensayos($expand=estado)))"
			].join("");
		
			//const url = `Obras/${ID}?$expand=${expandParams}`;
			const url = `Obras/${ID}?$expand=${expandParams}`;
		
			return this.callGetService(url);
		},

		postRescision: function ( oPayload ) {
			return this.callPostService("Rescisiones", oPayload);
		},
		
        
	
		postWorkflow: async function (body) {
			const resp = await fetch(`${this._urlWF}/v1/xsrf-token`, {
				method: "GET",
				headers: {
				"X-CSRF-Token": "Fetch",
				},
			});
			const token = resp.headers.get("x-csrf-token");
			const response = await fetch(`${this._urlWF}/v1/workflow-instances`, {
				method: "POST",
				headers: {
				"X-CSRF-Token": token,
				"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});
			return response;
		},
	

		createFolderDMS: async function ( Obra, Proveedor, P3, PI) {
			const urlPrincipal = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}`;
			const urlRegistros = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra`;
            const respFolderRegistros = await fetch(urlPrincipal, {
            method: "POST",
			body: this.getFormDMS(`Registros de obra`),
      });
		const respFolderPH = await fetch(urlRegistros, {
			method: "POST",
			body: this.getFormDMS(`Pruebas hidráulicas`),
      });
		const respFolderEnsayos = await fetch(urlRegistros, {
			method: "POST",
			body: this.getFormDMS(`Ensayos`),
      });
      return await Promise.all([
				respFolderRegistros.json(),
				respFolderPH.json(),
				respFolderEnsayos.json()
      ]);
		},

	getFormDMS: function (folder) {
      const oForm = new FormData();
      oForm.append("cmisaction", "createFolder");
      oForm.append("propertyId[0]", "cmis:name");
      oForm.append("propertyValue[0]", folder);
      oForm.append("propertyId[1]", "cmis:objectTypeId");
      oForm.append("propertyValue[1]", "cmis:folder");
      oForm.append("_charset_", "UTF-8");
      oForm.append("succinct", true);
      return oForm;
    },

	postDMSFile: async function (File, Obra,  Proveedor, P3, PI, Folder) {
		const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Actas/${Folder}/`;
		const oForm = new FormData();
		oForm.append("cmisaction", "createDocument");
		oForm.append("propertyId[0]", "cmis:name");
		oForm.append("propertyValue[0]", File.name);
		oForm.append("propertyId[1]", "cmis:objectTypeId");
		oForm.append("propertyValue[1]", "cmis:document");
		oForm.append("_charset_", "UTF-8");
		oForm.append("includeAllowableActions", true);
		oForm.append("succinct", true);
		oForm.append("media", File);
		const resp = await fetch(url, {
			method: "POST",
			body: oForm,
		});
		return await resp.json();
	},

		getFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
            const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const image = await fetch(url);
			return await image.blob();
		},

		deleteFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const oForm = new FormData();
			oForm.append("cmisAction", "delete");
			await fetch(url, {
				method: 'POST',
				body: oForm
			});
		},

		getSignedFile: async function (oPayload) {
			const url = `${this._urlDocuSignApi}/DocumentsDocuSign`;
			const oData = await fetch(url, {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify(oPayload),
			});
			return await oData.blob();
		  },

		createPdf: async function (oPayload) {
			const url = `${this._urlPdfApi}/`;
			const oData = await fetch(url, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(oPayload)
			});
			return await oData.json();
		},

		getResponsableAmbiental: function () {
				//const url = `Obras/${ID}?$expand=${expandParams}`;
				const url = `DesempeniosAmbientales`;
			
				return this.callGetService(url);
		},

		onCreateEnvironmentalResponsive: async function (oPayload, oView ) {
            try {
                const oNewResponsable = await this.callPostService("DesempeniosAmbientales", oPayload);
                let message = null;

                if (oNewResponsable.error) {
                    message = "Error al crear el reponsable ambiental";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
                message = "Responsable ambiental creado con éxito.";
                // Invocar el MessagePopover usando el MessageHandler
                Utils.showMessage( message , "Creación de Documento", "SUCCESS");

                return oNewPsdaDocument;
            } catch (error) {
                console.error("Error al crear el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
            }
        },

	};
});