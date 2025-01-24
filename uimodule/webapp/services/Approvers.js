sap.ui.define([
  "uimodule/services/psda_operations",
  "sap/m/MessageToast"
], function (PSDA_operations, MessageToast) {
  "use strict";


  function loadApproversData( oModel ) {
    _loadData(oModel);
  }

  async function _loadData(oModel) {
    const oObra = oModel.getProperty("/ObraData");
    const pi = oModel.getProperty("/Section/aPIList/0");
    const responsablesID = pi.responsables.responsables_ID;
    const oAprobadores = await PSDA_operations.getResponsables(responsablesID);
    if (oObra.error) {
      const message = this.getResourceBundle().getText("errorService");
      MessageToast.show(message);
    } else {
      const oAprobadoresActa = [];
      if (oAprobadores.value[0].inspectores !== null) {
        // Inspectores         
        /*      
        const Inspectores = oAprobadores.value[0].inspectores.filter(item => item.inspector.tipo_inspector_ID === 'EM').map(item => ({
          nombre_apellido: item.inspector.nombre,
          usuario: item.inspector.usuario,
          correo: item.inspector.correo,
          rol_ID: "IN",
          rol: { descripcion: "Inspector" },
          nivel_aprobacion: 1
        }));
        if (Inspectores.length !== 0) {
          Inspectores.forEach(inspector => {
            oAprobadoresActa.push(inspector);
          });
        }*/
        // Jefes de inspección
        const JefesInspeccion = oAprobadores.value[0].inspectores.filter(item => item.inspector.jefe_inspeccion !== null).map(item => ({
          nombre_apellido: item.inspector.jefe_inspeccion.nombre,
          usuario: item.inspector.jefe_inspeccion.usuario,
          correo: item.inspector.jefe_inspeccion.correo,
          rol_ID: "JI",
          rol: { descripcion: "Jefe de inspección" },
          nivel_aprobacion: 2
        }));
        if (JefesInspeccion.length !== 0) {
          JefesInspeccion.forEach(jefeInsp => {
            oAprobadoresActa.push(jefeInsp);
          });
        }
        // Jefes de área
        const JefesInsp = oAprobadores.value[0].inspectores.filter(item => item.inspector.jefe_inspeccion !== null);
        const JefesArea = JefesInsp.filter(item => item.inspector.jefe_inspeccion.jefe_area !== null).map(item => ({
          nombre_apellido: item.inspector.jefe_inspeccion.jefe_area.nombre + " " + item.inspector.jefe_inspeccion.jefe_area.apellido,
          usuario: item.inspector.jefe_inspeccion.jefe_area.usuario,
          correo: item.inspector.jefe_inspeccion.jefe_area.correo,
          rol_ID: "JA",
          rol: { descripcion: "Jefe de área" },
          nivel_aprobacion: 3
        }));
        if (JefesArea.length !== 0) {
          JefesArea.forEach(jefeArea => {
            oAprobadoresActa.push(jefeArea);
          });
        }
      }
      // Gerente
      if (oAprobadores.value[0].gerencia !== null) {
        if (oAprobadores.value[0].gerencia.gerente !== null) {
          const oGerente = {
            nombre_apellido: oAprobadores.value[0].gerencia.gerente.nombre + " " + oAprobadores.value[0].gerencia.gerente.apellido,
            usuario: oAprobadores.value[0].gerencia.gerente.usuario,
            correo: oAprobadores.value[0].gerencia.gerente.correo,
            rol_ID: "GE",
            rol: { descripcion: "Gerente" },
            nivel_aprobacion: 4
          };
          oAprobadoresActa.push(oGerente);
        }
      }
      // Director
      if (oAprobadores.value[0].direccion !== null) {
        if (oAprobadores.value[0].direccion.director !== null) {
          let oDirector = {
            nombre_apellido: oAprobadores.value[0].direccion.director.nombre + " " + oAprobadores.value[0].direccion.director.apellido,
            usuario: oAprobadores.value[0].direccion.director.usuario,
            correo: oAprobadores.value[0].direccion.director.correo,
            rol_ID: "DI",
            rol: { descripcion: "Director" },
            nivel_aprobacion: 5
          };
          oAprobadoresActa.push(oDirector);
        }
      }
      const oAprobadoresFinal = oAprobadoresActa.filter(item => item.correo !== null);
      oModel.setProperty("/Aprobadores", oAprobadoresFinal);
      oModel.setProperty("/Responsables", oAprobadores.value[0]);
    }
  }

  return {
    loadAprrovers: function (oModel) {
      return loadApproversData(oModel);
    }
  };

});