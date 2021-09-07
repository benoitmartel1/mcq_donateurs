<template>
  <div>
    <h1>Écran {{ display_id }}</h1>
    <h1>{{ Math.floor(counter * 10) / 10 }}</h1>
    <div class="name">
      {{
        names[0].compagnie
          ? names[0].compagnie
          : names[0].prenom + " " + names[0].nom
      }}
    </div>
    <div v-show="Math.floor((counter % 5) * 10) < 1" class="flash"></div>
  </div>
</template>

<script>
let numberOfDisplays = 6;
let counterInterval;
let logInInterval;
let subscribeInterval;
const hierarchy = [
  "Visionnaire",
  "Pionnier",
  "Précurseur",
  "Explorateur",
  "Découvreur",
  "Bâtisseur",
  "Artisan"
];
export default {
  data() {
    return {
      display_id: null,
      counter: 0,
      names: []
    };
  },
  async fetch() {
    this.display_id = this.$route.params.index;

    const { data, error } = await this.$db
      .from("mcq_content")
      .select("niveau, compagnie, nom, prenom, id");
    if (data) {
      this.names = this.filterNamesByDisplayId(data, this.display_id);
    }
  },
  mounted() {
    this.startSubscribeLoop();
  },
  methods: {
    filterNamesByDisplayId(data, id) {
      let filteredData = [];
      let sortedData = this.sortByNiveau(data);
      let counter = 0;
      for (let niveau = 0; niveau < sortedData.length; niveau++) {
        for (let item = 0; item < sortedData[niveau].items.length; item++) {
          if (counter % numberOfDisplays == id - 1)
            filteredData.push(sortedData[niveau].items[item]);
          counter++;
        }
      }
      return filteredData;
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
    startAnimation() {
      console.log("start");
      clearInterval(counterInterval);
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
          this.startLogInLoop();
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
body {
  font-size: 36px;
  font-family: "Lato", sans-serif;
  text-align: center;
}
.name {
}
.flash {
  position: absolute;
  left: calc(50vw - 25vh);
  top: calc(50vh - 25vh);
  z-index: -1;
  width: 50vh;
  height: 50vh;
  background: orangered;
}
</style>
