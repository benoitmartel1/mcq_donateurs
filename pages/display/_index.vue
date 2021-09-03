<template>
  <div>
    <h1>{{ display_id }}</h1>
    <div>{{ Math.floor(counter * 10) / 10 }}</div>
    <button @click="startCounter()">EMIT</button>
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
    const mcqStatus = this.$db
      .from("mcq_status")
      .on("UPDATE", payload => {
        this.startCounter();
      })
      .subscribe();

    setInterval(() => {
      this.updateStatus();
    }, 1000);

    this.display_id = this.$route.params.index;
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

<style lang="scss" scoped></style>
