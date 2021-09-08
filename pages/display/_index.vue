<template>
  <div class="display">
    <div class="infos">
      <div>Écran {{ display_id }}</div>
      <div>{{ currentNameIndex }}</div>
      <div>{{ Math.floor(counter * 10) / 10 }}</div>
      <div v-show="Math.floor((counter % 5) * 10) < 1" class="flash"></div>
    </div>
    <div
      :class="['canvas ', { control: display_id == 0 }]"
      :style="'margin-left:' + -1920 * display_id + 'px'"
    >
      <div class="column" v-for="(col, index) in grid" :key="index">
        <!-- <span class="id">{{ col }}</span> -->
        <div class="row" v-for="(row, r) in col" :key="(index + 1) * r">
          <!-- <span class="id">{{ row }}</span> -->
          <transition name="fade">
            <div
              v-show="Object.keys(row).length > 0"
              :class="['name ', row.niveau]"
            >
              {{ getName(row) }}
              <div class="niveau">{{ row.niveau }}</div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const nameTriggerDelay = 1000;
const numberOfDisplays = 6;

const hierarchy = [
  { name: "Visionnaire", time: 18 },
  { name: "Pionnier", time: 18 },
  { name: "Précurseur", time: 14 },
  { name: "Explorateur", time: 12 },
  { name: "Découvreur", time: 10 },
  { name: "Bâtisseur", time: 7 },
  { name: "Artisan", time: 5 }
];
const triggerToDisplayOrder = [3, 0, 4, 2, 5, 1];
const triggerToRowOrder = [3, 0, 4, 2, 1];

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
      grid: [
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}]
      ]
    };
  },
  async fetch() {
    this.display_id = this.$route.params.index;
    const { data, error } = await this.$db
      .from("mcq_content")
      .select("niveau, compagnie, nom, prenom, id");
    if (data) {
      //   this.names = this.filterNamesByDisplayId(data, this.display_id);
      this.names = this.shuffle(data, 12);
    }
  },
  mounted() {
    this.startSubscribeLoop();
  },
  methods: {
    random(seed) {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    },
    shuffle(array, seed) {
      // <-- ADDED ARGUMENT
      var m = array.length,
        t,
        i;

      // While there remain elements to shuffle…
      while (m) {
        // Pick a remaining element…
        i = Math.floor(this.random(seed) * m--); // <-- MODIFIED LINE

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
        ++seed; // <-- ADDED LINE
      }

      return array;
    },
    getName(item) {
      return item.compagnie ? item.compagnie : item.prenom + " " + item.nom;
    },
    // filterNamesByDisplayId(data, id) {
    //   let filteredData = [];
    //   let sortedData = this.sortByNiveau(data);
    //   let counter = 0;
    //   for (let niveau = 0; niveau < sortedData.length; niveau++) {
    //     for (let item = 0; item < sortedData[niveau].items.length; item++) {
    //       if (counter % numberOfDisplays == id - 1)
    //         filteredData.push(sortedData[niveau].items[item]);
    //       counter++;
    //     }
    //   }
    //   return filteredData;
    // },
    // sortByNiveau(src) {
    //   let temp = [];
    //   hierarchy.forEach(niveau => {
    //     temp.push({
    //       niveau: niveau,
    //       items: src.filter(item => item.niveau == niveau)
    //     });
    //   });
    //   return temp;
    // },
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
    findSlot() {
      let column;
      let row;
      let index = this.currentNameIndex;
      let columnOffset = 0;
      let rowOffset = 0;
      while (column == undefined) {
        let tempColumn = triggerToDisplayOrder[(index + columnOffset) % 6];
        if (
          this.grid[tempColumn].filter(row => {
            return Object.keys(row) == 0;
          }).length > 0
        ) {
          column = tempColumn;
        }
      }
      while (row == undefined) {
        let tempRow = triggerToRowOrder[(index + rowOffset) % 5];
        if (Object.keys(this.grid[column][tempRow]) == 0) row = tempRow;
      }
      return { row: row, column: column };
    },
    getDuration(name) {
      console.log(name.niveau);
      if (name.niveau) {
        let hierachyItem = hierarchy.filter(item => {
          return item.name == name.niveau;
        })[0];
        console.log(hierachyItem);
        return hierachyItem.time;
      } else {
        return 1;
      }
    },
    startAnimation() {
      clearInterval(counterInterval);
      clearInterval(nameTriggerInterval);
      this.currentNameIndex = 0;
      //The loop that trigger the next name apparition
      nameTriggerInterval = setInterval(() => {
        let slot = this.findSlot();
        this.grid[slot.column][slot.row] = this.names[this.currentNameIndex];
        setTimeout(() => {
          this.grid[slot.column][slot.row] = {};
        }, this.getDuration(this.names[this.currentNameIndex]) * 1000);
        this.currentNameIndex++;
        console.log(this.grid);
        console.log(this.names.length);
      }, nameTriggerDelay);

      // Simple timer
      this.counter = 0;
      counterInterval = setInterval(() => {
        this.counter += 0.1;
      }, 100);
    },
    async subscribe() {
      const updateSuscribe = await this.$db
        .from("mcq_displays")
        .on("UPDATE", payload => {
          this.startAnimation();
        })
        .subscribe();
      if (updateSuscribe) {
        {
          if (this.display_id > 0) this.startLogInLoop();
          clearInterval(subscribeInterval);
        }
      }
    },
    async logIn() {
      const { data, error } = await this.$db
        .from("mcq_displays")
        .update({ updated_at: "now()" })
        .eq("display", this.display_id);
      if (data) {
        console.log(
          "Display " +
            data[0].display +
            " => logged in at " +
            data[0].updated_at
        );
        clearInterval(logInInterval);
      }
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap");
body,
html {
  font-family: "Lato", sans-serif;
  text-align: center;
  margin: 0;
  padding: 0;
  color: white;
}
* {
  box-sizing: border-box;
}
.canvas {
  display: flex;
  width: calc(1920px * 6);
}
.canvas.control {
  border: 3px yellow solid;
  transform: scale(0.2);
  transform-origin: 0 0;
}
.canvas.control .column {
  border: 3px red solid;
}
.canvas.control .row {
}
.canvas .column {
  width: 1920px;
  height: 1080px;
  padding: 100px;
}
.canvas .row {
  /* border: 1px green solid; */
  height: calc(880px / 5);
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
  background: black;
  border: 1px solid blue;
  color: white;
  width: 1920px;
  height: 1080px;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.infos {
  display: inline-block;
  font-size: 12px;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100px;
  width: 1920px;
  padding: 10px;
}

.flash {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: greenyellow;
}
.name .niveau {
  font-size: 20px;
}

.name.Visionnaire {
  font-size: 300px;
  animation: moveLeft 18s linear both;
}
.name.Pionnier {
  font-size: 300px;
  animation: moveLeft 18s linear both;
}
.name.Précurseur {
  font-size: 200px;
  animation: moveLeft 14s linear both;
}
.name.Explorateur {
  font-size: 160px;
  animation: moveLeft 12s linear both;
}
.name.Découvreur {
  font-size: 120px;
  animation: moveLeft 10s linear both;
}
.name.Bâtisseur {
  font-size: 100px;
  animation: moveLeft 7s linear both;
}
.name.Artisan {
  font-size: 70px;
  animation: moveLeft 5s linear both;
}

@keyframes moveLeft {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-300px);
  }
}
</style>
