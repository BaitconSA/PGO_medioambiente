sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
  "use strict";
  return {

    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(3);
    },

    formatID: function (ID) {
      return toString(ID);
    },

    formatDateFront: function (oDate) {
      if (!oDate) {
        return;
      }
      let oYear = oDate.getUTCFullYear();
      let oMonth = oDate.getUTCMonth() + 1;
      let oDay = oDate.getUTCDate();
      if (oMonth.toString() < 10) {
        oMonth = "0" + oMonth;
      }
      if (oDay.toString() < 10) {
        oDay = "0" + oDay;
      }
      let formatDate = oYear.toString() + "-" + oMonth.toString() + "-" + oDay.toString();
      return formatDate;
    },

    formatDateString: function (sDate) {
      if (!sDate) {
        return null;
      }
      const date = new Date(sDate);
      // Convertir a la zona horaria GMT-3
      const options = {
        timeZone: 'America/Sao_Paulo', // GMT-3
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };
      const formattedDate = new Intl.DateTimeFormat('es-ES', options).format(date);
      return formattedDate;
    },

    formatDateTable: function (oDate) {
      if (!oDate) {
        return;
      }
      const [year, month, day] = oDate.split("-");
      return `${day}/${month}/${year}`;
    },

    formattPerformer: function (aArticulos) {
      const aHtmlTextPerformers = [];
      if (aArticulos.length > 0) {
        aHtmlTextPerformers.push("<ul style='text-align: left;'>");
        for (const articulo of aArticulos) {
          if (articulo.articulo) {
            aHtmlTextPerformers.push(`
                      <li>
                          <strong style='color:green; font-style:italic'>${articulo.articulo.ID} - </strong>
                          <span style='color:#000; font-style:italic'>${articulo.articulo.descripcion}</span>
                      </li>
                  `);
          }
        }
        aHtmlTextPerformers.push("</ul>");
      } else {
        aHtmlTextPerformers.push(`<div>sin datos.</div>`);
      }
      return aHtmlTextPerformers.join("");
    },


    testingmulticombo: function (articulos) {
      if (articulos !== undefined)
        return articulos.map((articulo) => articulo?.ID);
    },

    toNumberDecimal: function (sValue) {
      return parseFloat(sValue).toFixed(2);
    },

    formatoPorcentaje: function (sArticuloID, iPorcentaje) {
      if (sArticuloID && iPorcentaje !== undefined && iPorcentaje !== null) {
        return `Artículo: ${sArticuloID}\nPorcentaje: ${iPorcentaje.toFixed(2)}%`;
      }
      return `Artículo: ${sArticuloID}\nPorcentaje: Sin porcentaje`;
    },

    formatToPercentageArticles: function (aArticulos) {
      const aHtmlTextPerformers = [];
      if (aArticulos.length > 0) {
        aHtmlTextPerformers.push("<ul style='text-align: left;'>");
        for (const articulo of aArticulos) {
          if (articulo.articulo) {
            let sPorcentaje = articulo.porcentaje !== null && articulo.porcentaje !== undefined
              ? `${articulo.porcentaje}%`
              : "Sin porcentaje";
            aHtmlTextPerformers.push(`
                    <li>
                        <strong style='color:green; font-style:italic'>${articulo.articulo_ID}</strong>
                        <span style='color:#000; font-style:italic'>${sPorcentaje}</span>
                    </li>
                `);
          }
        }
        aHtmlTextPerformers.push("</ul>");
      } else {
        aHtmlTextPerformers.push(`<div>sin datos.</div>`);
      }
      return aHtmlTextPerformers.join("");
    },


    _formatCurrency: function (amount) {
      // Use NumberFormat to format the amount as currency
      let oCurrencyFormat = NumberFormat.getCurrencyInstance();
      oCurrencyFormat = oCurrencyFormat.format(amount); // Replace "USD" with your desired currency code
      return `$ ${oCurrencyFormat}`;
    },



  };
});
