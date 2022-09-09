<template>
  <div
    class="display"
    :style="{
      background: 'rgba(255, 255, 255, ' + backLevel / 100 + ')'
    }"
  >
    <div v-show="showGrid" class="grid">
      <div v-for="c in 16" :key="c" class="c">
        <div v-for="r in 10" :key="r" class="r">{{ (r - 1) * 16 + c }}</div>
      </div>
    </div>
    <div class="infos" v-show="showInfos">
      <div>Écran {{ display_id }}</div>
      <div>Nom : {{ currentNameIndex }} / {{ names.length }}</div>
      <div>{{ Math.floor(counter * 10) / 10 }}</div>
      <div v-show="Math.floor((counter % 5) * 10) < 1" class="flash"></div>
    </div>
    <div
      :class="['canvas ', { control: display_id == 0 }]"
      :style="getOffset()"
    >
      <div class="column" v-for="(col, index) in grid" :key="index">
        <!-- <span class="id">{{ col }}</span> -->
        <div v-if="index == display_id - 1 || display_id == 0">
          <div class="row" v-for="(row, rowIndex) in col" :key="row.id">
            <!-- <span class="id">{{ row }}</span> -->
            <transition name="fade">
              <div
                v-show="Object.keys(row).length > 0"
                :class="['name ', row.niveau]"
                :style="setStyle(row, rowIndex)"
              >
                <div class="nameToBlur" v-html="getName(row)"></div>
                <div class="niveau">{{ row.niveau }}</div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
//Temps en ms entre els apparitions des noms
const nameTriggerDelay = 600;

//Nombre de displays
const numberOfDisplays = 7;
const numberOfRows = 4;

//Paramètres par catégorie pour l'affichage {Nom de la catégorie, durée de l'affichage, Nombre d'apparitions au total}
const hierarchy = [
  { name: "Visionnaire", time: 15, exposure: 3 },
  { name: "Pionnier", time: 15, exposure: 3 },
  { name: "Précurseur", time: 15, exposure: 3 },
  { name: "Explorateur", time: 15, exposure: 3 },
  { name: "Découvreur", time: 15, exposure: 2 },
  { name: "Bâtisseur", time: 15, exposure: 2 },
  { name: "Artisan", time: 15, exposure: 1 }
];
//Chaque nom de la loop est attribué au prochain display/row défini par ces arrays
const triggerToDisplayOrder = [3, 0, 4, 2, 5, 1, 6];
const triggerToRowOrder = [3, 0, 2, 1];

let counterInterval;
let nameTriggerInterval;
let logInInterval;
let subscribeInterval;

export default {
  fetchOnServer: false,
  data() {
    return {
      display_id: null,
      currentNameIndex: 0,
      counter: 0,
      names: [],
      grid: [],
      showGrid: false,
      showInfos: false,
      backLevel: 0
    };
  },
  async fetch() {
    //Fetch all names in supabase db
    this.display_id = this.$route.params.index;
    const names = await this.$db
      .from("mcq_content")
      .select("niveau, compagnie, nom, prenom, id")
      .order("compagnie")
      .then(res => {
        return res.data;
      })
      .catch(err => {
        console.log(err);
      });
    if (names) {
      this.names = this.applyExposure(names);
    }
    const status = await this.$db
      .from("mcq_status")
      .select("*")
      .eq("id", 1)
      .then(res => {
        return res.data[0];
      })
      .catch(err => {
        console.log(err);
      });
    if (status) {
      //   console.log(status);
      this.showGrid = status.show_grid;
      this.showInfos = status.show_infos;
      this.backLevel = status.back_level;
    }
  },
  mounted() {
    this.startSubscribeLoop();
    this.statusSubscribe();
  },

  methods: {
    applyExposure(arr) {
      //Modifier la liste names selon le nombre d'apparation (exposure) que doit avoir chaque nom
      let splittedNames = [];
      let mergedNames = [];

      //Récupérer les différents niveaux de Exposure
      let exposuresOnly = hierarchy.map(h => {
        return h.exposure;
      });
      let exposures = Array.from(new Set(exposuresOnly)).sort();

      //Trouver le nombre de Exposure max et min
      let max = exposures[exposures.length - 1];
      let min = exposures[0];

      //Créer autant de sous-groupes que de nombre maximal d'exposure (si au maximum un nom doit revenir 3 fois, alors créer 3 sous-groupes)
      for (let e = max; e > 0; e--) {
        splittedNames.push([]);
      }

      //Pour chacun des niveaux de Exposure...
      exposures.forEach(e => {
        let tempArr = [];
        //Récupérer les niveaux affectés
        let targetedNiveaux = hierarchy
          .filter(item => item.exposure == e)
          .map(n => {
            return n.name;
          });
        //Récupérer les noms affectés, i.e. qui ont le niveau correspondant
        let targetedNames = arr.filter(item =>
          targetedNiveaux.includes(item.niveau)
        );
        //Dupliquer les noms autant de fois que leur Exposure
        for (let i = e; i > 0; i--) {
          tempArr = tempArr.concat(targetedNames);
        }
        //Divisier toutes les iterations en parts égales parmi les sous-groupes
        for (let i = 0; i < max; i++) {
          let amount = Math.ceil(tempArr.length / max);
          splittedNames[i] = splittedNames[i].concat(
            tempArr.slice(i * amount, (i + 1) * amount)
          );
        }
      });

      //Mélanger les noms à l'intérieur des sous-groupes et remettre tous les noms dans une seule array
      for (let i = 0; i < max; i++) {
        //mergedNames = mergedNames.concat(splittedNames[i]);
        mergedNames = mergedNames.concat(this.shuffle(splittedNames[i], 12));
      }
      return mergedNames;
    },
    startSubscribeLoop() {
      subscribeInterval = setInterval(() => {
        this.subscribe();
      }, 2000);
    },
    startLogInLoop() {
      logInInterval = setInterval(() => {
        this.logIn();
      }, 2000);
    },
    async statusSubscribe() {
      //Subscribe to Supabase Status Table update notifications
      const updateSubscribe = await this.$db
        .from("mcq_status")
        .on("UPDATE", payload => {
          this.showGrid = payload.new.show_grid;
          this.showInfos = payload.new.show_infos;
          this.backLevel = payload.new.back_level;
          //   console.log(payload.new.showGrid);
        })
        .subscribe();
    },
    async subscribe() {
      //Subscribe to Supabase Table update notifications
      const updateSubscribe = await this.$db
        .from("mcq_displays")
        .on("UPDATE", payload => {
          //A new display just logged in, so all displays must restart
          console.log("Display login, will restart");
          this.startAnimation();
        })
        .subscribe();
      if (updateSubscribe) {
        console.log("Subscribe successful");
        {
          if (this.display_id > 0) {
            this.startLogInLoop();
          } else {
            //The display 0 is for approbation only, so it can start the animation independently
            this.startAnimation();
          }
          clearInterval(subscribeInterval);
        }
      }
    },
    async logIn() {
      //Update Supabase table to tell all other displays this one just logged in so they can all sync together
      const { data, error } = await this.$db
        .from("mcq_displays")
        .update({ updated_at: "now()" })
        .eq("display", this.display_id == 0 ? 1 : this.display_id);
      if (data) {
        console.log(
          "Display " +
            data[0].display +
            " => logged in at " +
            data[0].updated_at
        );
        clearInterval(logInInterval);
      }
    },
    startAnimation() {
      console.log("Starting");
      //Remove all timers--------------
      clearInterval(counterInterval);
      clearInterval(nameTriggerInterval);

      for (var i = setTimeout(function() {}, 0); i > 0; i--) {
        window.clearInterval(i);
        window.clearTimeout(i);
        if (window.cancelAnimationFrame) window.cancelAnimationFrame(i);
      }

      //Clean the grid--------------
      this.createGrid();

      //Reset the main index
      this.currentNameIndex = 0;

      //The loop that triggers the next name apparition
      nameTriggerInterval = setInterval(() => {
        let currentName = this.names[this.currentNameIndex];

        if (currentName) {
          //Find next available location
          let slot = this.findSlot();

          //Copy name object in slot of grid
          this.grid[slot[0]][slot[1]] = currentName;

          let isLast = this.currentNameIndex + 1 >= this.names.length;
          //Set timeout to remove object from grid
          setTimeout(() => {
            this.grid[slot[0]][slot[1]] = {};

            //If last name
            if (isLast) {
              console.log("Animation done.");
              if (this.display_id == 1 || this.display_id == 0) {
                this.startLogInLoop();
              }
            }
          }, this.getDuration(currentName) * 1000);

          this.currentNameIndex++;
          //Restart names if no more items in names
          if (this.currentNameIndex >= this.names.length)
            clearInterval(nameTriggerInterval);
        }
      }, nameTriggerDelay);

      // Simple timer
      this.counter = 0;
      counterInterval = setInterval(() => {
        this.counter += 0.1;
      }, 100);
    },
    setStyle(row, rowIndex) {
      if (row.id !== undefined) {
        let offset = (30 - this.getName(row).length) * 30;
        offset = parseInt(offset < 0 ? 20 : offset);
        // console.log(this.getName(row) + " " + offset);
        switch (rowIndex) {
          case 0:
            return "margin-left: " + offset * 0.5 + "px";
            break;
          case 1:
            return "margin-right: " + offset + "px";
            break;
          //   case 2:
          //     return "margin-left: " + offset + "px";
          //     break;
          case 3:
            return "margin-right: " + offset * 0.5 + "px";
            break;
          default:
            return "";
        }
      }
    },
    createGrid() {
      //Populate the grid which keeps track of which name shows up where
      this.grid = [];
      for (let col = 0; col < numberOfDisplays; col++) {
        let column = [];
        for (let row = 0; row < numberOfRows; row++) {
          column.push({});
        }
        this.grid.push(column);
      }
    },
    findSlot() {
      //Assign an available slot (returns row/column) in grid array for the next name to show up
      let column;
      let row;
      let index = this.currentNameIndex;
      let columnOffset = 0;
      let rowOffset = 0;
      while (column == undefined) {
        let tempColumn =
          triggerToDisplayOrder[(index + columnOffset) % numberOfDisplays];
        if (
          this.grid[tempColumn].filter(row => {
            return Object.keys(row) == 0;
          }).length > 0
        ) {
          column = tempColumn;
        }
      }
      while (row == undefined) {
        let tempRow = triggerToRowOrder[(index + rowOffset) % numberOfRows];
        if (Object.keys(this.grid[column][tempRow]) == 0) row = tempRow;
      }
      return [column, row];
    },
    shuffle(array, seed) {
      //Shuffles array based on the same seed for all displays, so they show same content
      var m = array.length,
        t,
        i;
      while (m) {
        i = Math.floor(this.random(seed) * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
        ++seed;
      }
      return array;
    },
    //----------Helpers and routines methods
    getOffset() {
      return this.display_id > 0
        ? "margin-left:" + -1920 * (this.display_id - 1) + "px"
        : "";
    },
    getName(item) {
      return this.formatLineBreak(
        item.compagnie ? item.compagnie : item.prenom + " " + item.nom
      );
    },
    formatLineBreak(str) {
      let lineBreakSymbol = "--";
      return str.replace(lineBreakSymbol, "<br>");
    },

    getDuration(name) {
      //Returns the defined duration for the matching niveau
      if (name) {
        let hierachyItem = hierarchy.filter(item => {
          return item.name == name.niveau;
        })[0];
        return hierachyItem.time;
      } else {
        return 10;
      }
    },
    random(seed) {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
  }
};
</script>

<style>
:root {
  --nbOfDisplays: 7;
  --nbOfRows: 4;
  --displayWidth: 1920px;
  --displayHeight: 1200px;
}
body,
html {
  text-align: center;
  margin: 0;
  padding: 0;
  color: white;
  background: black;
}
* {
  box-sizing: border-box;
}
* {
  font-smooth: always;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.canvas {
  display: flex;
  width: calc(1920px * var(--nbOfDisplays));
}
.canvas.control {
  margin: auto;
  border: 3px yellow solid;
  transform: scale(0.14);
  transform-origin: 0 0;
}
.canvas.control .column {
  border: 4px rgba(255, 142, 142, 0.8) dotted;
}

.canvas .column {
  width: var(--displayWidth);
  height: var(--displayHeight);
  padding-top: 50px;
}
.canvas .row {
  display: flex;
  font-size: 54px;
  /* justify-content: center; */
  align-items: center;
  /* border: 1px green solid; */
  height: calc((var(--displayHeight) - 100px) / var(--nbOfRows));
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 3s;
}
.fade-enter,
.fade-leave-active {
  opacity: 0;
}
.id {
  position: absolute;
  opacity: 0.2;
}
.display {
  /* background: white; */
  /* border: 1px solid blue; */
  color: white;
  width: 1920px;
  height: 1200px;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.infos {
  font-size: 32px;
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.flash {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: greenyellow;
}

.name {
  /* border: 1px orange solid; */
  font-family: "Butler";
  max-width: 1600px;
  line-height: 1.2em;
  /* margin: auto; */
  animation: moveLeft 15s linear both;
}
.name .nameToBlur {
  animation: blurInOut 15s linear both;
}
.name .niveau {
  font-family: "Optimo-Theinhardt";
  font-size: 0.32em;
  line-height: 1.4em;
  letter-spacing: 0.5em;
  animation: blurInOut 15s linear both;
}

.name.Visionnaire {
  font-size: 2em;
}
.name.Pionnier {
  font-size: 2em;
}
.name.Précurseur {
  font-size: 1.75em;
}
.name.Explorateur {
  font-size: 1.5em;
}
.name.Découvreur {
  font-size: 1.35em;
}
.name.Bâtisseur {
  font-size: 1.2em;
}
.name.Artisan {
  font-size: 1em;
}
.column .row:nth-child(2),
.column .row:nth-child(4) {
  justify-content: flex-end;
}
.column .row:nth-child(3) {
  justify-content: center;
  align-items: center;
}
.column .row:nth-child(3) .name {
  transform-origin: 50% 50%;
}
.column .row:nth-child(2) .name,
.column .row:nth-child(4) .name {
  transform-origin: 100% 50%;
}
.column .row:nth-child(1) .name {
  transform-origin: 0 50%;
}
.column:nth-child(1) .row:nth-child(1) {
  /* background: chartreuse; */
  margin-left: 60px;
}
.column:last-child .row:nth-child(2),
.column:last-child .row:nth-child(4) {
  /* background: chartreuse; */
  margin-right: 60px;
}
.grid {
  position: absolute;
  min-width: var(--displayWidth);
  min-height: var(--displayHeight);
  display: flex;

  align-items: stretch;
}
.grid .c {
  border-right: 1px greenyellow solid;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.grid .r {
  color: greenyellow;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px greenyellow solid;
  flex: 1;
}

@keyframes moveLeft {
  0% {
    transform: scale(1) perspective(1px) translate3d(0, 0, 0);
    opacity: 0;
    /* filter: blur(20px); */
    /* margin-top: 0; */
  }
  25% {
    /* filter: blur(0); */
    opacity: 1;
  }
  75% {
    /* filter: blur(0); */
    opacity: 1;
  }
  100% {
    opacity: 0;
    /* filter: blur(20px); */
    /* margin-top: 200px; */
    transform: scale(1) perspective(1px) translate3d(0, 0, 0.2px);
  }
}
@keyframes blurInOut {
  0% {
    filter: blur(20px);
  }
  25% {
    filter: blur(0);
  }
  75% {
    filter: blur(0);
  }
  100% {
    filter: blur(20px);
  }
}
</style>
