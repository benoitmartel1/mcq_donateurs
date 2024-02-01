<template>
  <div class="inner">
    <div class="notice">
      Si un nom est trop long, forcez un retour à la ligne (Enter) dans ce
      dernier en inscrivant :
      <br /><b>-- ( deux traits d'union )</b><br />
      à l'endroit de la coupure dans la cellule du fichier Excel avant l'upload.
    </div>
    <div class="btn">
      <div>
        <label
          for="file-btn"
          :class="['custom-file-upload', { disabled: data.newData.length > 0 }]"
        >
          Télécharger un fichier Excel
        </label>
        <div>
          <span class="text"></span>
          <input @change="onUpload($event)" type="file" id="file-btn" />
        </div>
      </div>
      <div v-if="data.newData.length">
        <label for="upload-btn" class="custom-file-upload">
          Mettre à jour la boucle en ligne
        </label>
        <div>
          <span class="text"></span>
          <input @click="updateDatabase()" id="upload-btn" />
          <!-- <button @click="updateDatabase()"></button> -->
        </div>
      </div>
    </div>
    <div id="output">
      <div v-for="(d, idx) in dataToDisplay" :key="d">
        <div v-if="d.length > 0">
          <h3 v-if="d.length" class="total">
            <div v-if="idx == 'currentData'">
              Présentement en ligne
              <span class="nb">{{ data.currentData.length }}</span>
            </div>
            <div v-else>
              À remplacer par
              <span class="nb">{{ data.newData.length }}</span>
            </div>
            <hr />
          </h3>
          <div v-for="n in d" :key="n.niveau">
            <h3>
              <span class="nb">{{ n.items.length }}</span
              >{{ n.niveau }}
            </h3>
            <ul>
              <li v-for="(i, idx) in n.items" :key="idx">
                <div v-if="i.compagnie">{{ i.compagnie }}</div>
                <div v-else>{{ i.prenom + " " + i.nom }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let fileInputEl;
let columnsEl;
let outputEl;
const hierarchy = [
  "Visionnaire",
  "Pionnier",
  "Précurseur",
  "Explorateur",
  "Découvreur",
  "Bâtisseur",
  "Artisan"
];
const columns = ["Niveau", "Compagnie", "Nom", "Prenom"];

export default {
  fetchOnServer: false,
  data() {
    return {
      data: { currentData: [], newData: [] },
      dataToDisplay: { currentData: [], newData: [] }
    };
  },

  async fetch() {
    this.data.currentData = await this.$db
      .from("mcq_content")
      .select("nom, compagnie, niveau, id, prenom")
      .then(res => {
        return res.data;
      });
    this.dataToDisplay.currentData = this.sortByNiveau(this.data.currentData);
  },

  methods: {
    async updateDatabase() {
      let clearAllData = await this.$db
        .from("mcq_content")
        .delete()
        .neq("id", 0)
        .then(res => {
          console.log(res.data);
          return res.data;
        })
        .catch(err => console.log(err));
      if (clearAllData) {
        let insertNewData = await this.$db
          .from("mcq_content")
          .insert(this.data.newData)
          .then(res => {
            return res.data;
          });
        if (insertNewData) {
          //   alert("Mis à jour");
          console.log(insertNewData);
          location.reload();
        }
      }
    },
    sortByNiveau(src) {
      let temp = [];
      hierarchy.forEach(niveau => {
        temp.push({
          niveau: niveau,
          items: src.filter(item => item.niveau == niveau)
        });
      });
      return temp;
    },
    onUpload(event) {
      const reader = new FileReader();
      const file = event.target.files[0];

      reader.onload = e => {
        const fileContent = e.target.result;
        const workbook = XLSX.read(fileContent, { type: "binary" });
        workbook.SheetNames.forEach(sheetname => {
          const data = XLSX.utils.sheet_to_row_object_array(
            workbook.Sheets[sheetname]
          );

          //Convert column names
          let temp = data.map(item => {
            return {
              niveau: item.Niveau,
              nom: item.Nom,
              prenom: item.Prénom,
              compagnie: item.Compagnie
            };
          });
          //Remove empty entries
          this.data.newData = temp.filter(item => {
            return (
              item.nom !== undefined ||
              item.prenom !== undefined ||
              item.compagnie !== undefined
            );
          });
          this.dataToDisplay.newData = this.sortByNiveau(this.data.newData);
        });
      };

      reader.onerror = error => {
        console.log("Error", error);
      };

      reader.readAsBinaryString(file);
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap");
body {
  font-size: 18px;
  font-family: "Lato", sans-serif;
  margin: 0;
}
#output {
  display: flex;
  justify-content: center;
}
#output > div {
  margin: 2%;
  /* width: 50%; */
  /* display: inline-block; */
}
h3 {
  font-weight: 900;
  color: rgb(67, 73, 83);
}
.inner {
  max-width: 960px;
  margin: auto;
}
.btn {
  margin-top: 50px;

  /* text-align: center; */
  display: flex;
  /* align-items: center; */
  justify-content: center;
}
.disabled {
  opacity: 0.3;
}
.disabled:hover {
  opacity: 1;
}
.btn div {
  margin-right: 10px;
}
.btn label:hover {
  background: #eee;
}
h3 .nb {
  float: right;
}
#upload-btn {
  display: none;
}
#output ul {
  background: #eee;
  box-sizing: border-box;
  /* width: 380px; */
  list-style-type: none; /* Remove bullets */
  padding: 10px; /* Remove padding */
}
#output li {
  padding: 2px 0;
}
input[type="file"] {
  display: none;
}
.custom-file-upload {
  border: 1px solid #ccc;
  display: inline-block;
  padding: 10px 18px;
  cursor: pointer;
  border-radius: 50px;
}
.notice {
  font-size: 0.9em;
  width: max-content;
  margin: auto;
  text-align: center;
  /* width: 100%; */
  padding: 10px 30px;
  color: white;
  background: lightskyblue;
}
</style>
