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
      :style="getOffset()"
    >
      <div class="column" v-for="(col, index) in grid" :key="index">
        <!-- <span class="id">{{ col }}</span> -->
        <div v-if="index == display_id - 1 || display_id == 0">
          <div class="row" v-for="row in col" :key="row.id">
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
  </div>
</template>

<script>
const nameTriggerDelay = 600;
const numberOfDisplays = 6;

const hierarchy = [
  { name: "Visionnaire", time: 15 },
  { name: "Pionnier", time: 15 },
  { name: "Précurseur", time: 15 },
  { name: "Explorateur", time: 15 },
  { name: "Découvreur", time: 15 },
  { name: "Bâtisseur", time: 15 },
  { name: "Artisan", time: 15 }
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
      grid: []
    };
  },
  async fetch() {
    this.display_id = this.$route.params.index;
    const { data, error } = await this.$db
      .from("mcq_content")
      .select("niveau, compagnie, nom, prenom, id");
    //   .limit(100);
    if (data) {
      //   this.names = this.filterNamesByDisplayId(data, this.display_id);
      this.names = this.shuffle(data, 12);
    }
  },
  mounted() {
    this.startSubscribeLoop();
  },
  methods: {
    getOffset() {
      return this.display_id > 0
        ? "margin-left:" + -1920 * (this.display_id - 1) + "px"
        : "";
    },
    getName(item) {
      return item.compagnie ? item.compagnie : item.prenom + " " + item.nom;
    },
    createGrid() {
      this.grid = [];
      for (let col = 0; col < numberOfDisplays; col++) {
        let column = [];
        for (let row = 0; row < 5; row++) {
          column.push({});
        }
        this.grid.push(column);
      }
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
      return [column, row];
    },
    getDuration(name) {
      //   console.log(name.niveau);
      if (name) {
        let hierachyItem = hierarchy.filter(item => {
          return item.name == name.niveau;
        })[0];
        // console.log(hierachyItem);
        return hierachyItem.time;
      } else {
        return 10;
      }
    },
    startAnimation() {
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
          console.log(
            "copied " +
              currentName.compagnie +
              " | " +
              currentName.nom +
              "to " +
              slot[0] +
              ":" +
              slot[1]
          );
          let isLast = this.currentNameIndex + 1 >= this.names.length;
          //Set timeout to remove object from grid
          setTimeout(() => {
            console.log("timeout");
            this.grid[slot[0]][slot[1]] = {};
            console.log("Removed " + slot[0] + ":" + slot[1]);

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
          //   this.currentNameIndex == 0;
        }
        // console.log(this.grid);
        // console.log(this.names.length);
      }, nameTriggerDelay);

      // Simple timer
      this.counter = 0;
      counterInterval = setInterval(() => {
        this.counter += 0.1;
      }, 100);
    },
    async subscribe() {
      console.log("subscribing...");
      const updateSuscribe = await this.$db
        .from("mcq_displays")
        .on("UPDATE", payload => {
          console.log("Subscribe Receive :");
          console.log(payload);
          this.startAnimation();
        })
        .subscribe();
      if (updateSuscribe) {
        {
          if (this.display_id > 0) {
            this.startLogInLoop();
          } else {
            this.startAnimation();
          }
          clearInterval(subscribeInterval);
        }
      }
    },
    async logIn() {
      console.log("logging in...");
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
* {
  font-smooth: always;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.canvas {
  display: flex;
  width: calc(1920px * 6);
}
.canvas.control {
  border: 3px yellow solid;
  transform: scale(0.165);
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
  font-size: 22px;
  letter-spacing: 0.5em;
}
.name {
  width: 1600px;
  margin: auto;
  animation: moveLeft 15s linear both;
}
.name.Visionnaire {
  font-size: 120px;
}
.name.Pionnier {
  font-size: 120px;
}
.name.Précurseur {
  font-size: 100px;
}
.name.Explorateur {
  font-size: 90px;
}
.name.Découvreur {
  font-size: 80px;
}
.name.Bâtisseur {
  font-size: 70px;
}
.name.Artisan {
  font-size: 60px;
}
.column .row:nth-child(2) .name,
.column .row:nth-child(4) .name {
  margin-left: 160px;
  transform-origin: 1000 50%;
}
.column .row:nth-child(3) .name {
  margin-left: -160px;
  transform-origin: 0 0;
}
@keyframes moveLeft {
  0% {
    transform: scale(1) perspective(1200px) translate3d(0, 0, 0);
    opacity: 0;
    /* margin-top: 0; */
    filter: blur(20px);
  }
  25% {
    filter: blur(0);
    opacity: 1;
  }
  75% {
    filter: blur(0);
    opacity: 1;
  }
  100% {
    opacity: 0;
    filter: blur(20px);
    /* margin-top: 200px; */
    transform: scale(1.3) perspective(1200px) translate3d(0, 0, 0);
  }
}
</style>
