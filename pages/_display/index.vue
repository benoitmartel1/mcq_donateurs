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
export default {
  data() {
    return {
      display_id: null,
      counter: 0
    };
  },

  mounted() {
    // console.log(this.$route.params.display);
    this.display_id = this.$route.params.display;
    const mcqStatus = this.$db
      .from("mcq_status")
      .on("UPDATE", payload => {
        this.startCounter();
      })
      .subscribe();

    setInterval(() => {
      this.updateStatus();
    }, 1000);
  },
  methods: {
    startCounter() {
      console.log("start");
      clearInterval(counterInterval);
      this.counter = 0;
      counterInterval = setInterval(() => {
        this.counter += 0.1;
      }, 100);
    },
    updateStatus() {
      const { data, error } = this.$db
        .from("mcq_displays")
        .update({ updated_at: "now()" })
        .eq("display", this.display_id)
        .then(res => {
          //   console.log(res);
        });
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
