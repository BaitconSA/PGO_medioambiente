sap.ui.define(
	["sap/ui/model/json/JSONModel", "sap/base/Log"],
	function (JSONModel, Log) {
		"use strict";

		return {
             findRole: function (aRoles, sRole ) {
                if(Array.isArray(aRoles)) {
                    return aRoles.find(role => role === sRole);
                } else if (aRoles && Array.isArray(aRoles.value)){
                    return aRoles.value.find(role => role === sRole);
                }
                return null;
            },
	
			evaluateUserPermissions: function ( aRoles ) {
                const sInspector = this.findRole (aRoles, "PGO_Inspector");
                const sJefeInspector = this.findRole (aRoles, "PGO_JefeInspeccion");
                const sContratista = this.findRole (aRoles, "PGO_Contratista");
                const sJefeArea = this.findRole (aRoles, "PGO_JefeArea");
                const sDirector = this.findRole (aRoles, "PGO_Director");				
                const sGerente = this.findRole (aRoles, "PGO_Gerente");	

                const permisos = {
                    view: [sInspector, sJefeInspector, sContratista, sJefeArea, sDirector, sGerente].some(Boolean),
                    edit: [sJefeInspector, sJefeArea, sDirector, sGerente].some(Boolean),
                    download: [sDirector, sGerente].some(Boolean),
                    execute: [sInspector, sJefeInspector, sContratista, sJefeArea, sDirector, sGerente].some(Boolean),
                    print: [sInspector, sJefeInspector, sContratista, sJefeArea, sDirector, sGerente].some(Boolean),
                    approve: [sDirector, sGerente].some(Boolean),
                    reject: [sDirector, sGerente].some(Boolean),
                    delete: [sDirector, sGerente].some(Boolean),
                };
                
                return permisos;
			}

		};
	}
);