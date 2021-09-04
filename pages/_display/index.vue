<template>
  <div>
    <h1>{{ display_id }}</h1>
    <h1>{{ Math.floor(counter * 10) / 10 }}</h1>
    <button @click="startCounter()">EMIT</button>

    <div v-show="Math.floor((counter % 5) * 10) < 1" class="flash"></div>
  </div>
</template>

<script>
let counterInterval;
let logInInterval;
let subscribeInterval;
export default {
  data() {
    return {
      display_id: null,
      counter: 0
    };
  },

  mounted() {
    this.display_id = this.$route.params.display;
    this.startSubscribeLoop();
  },
  methods: {
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

<style scoped>
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
