<template>
  <div>
    <ul>
      {{
        names.length
      }}
      <li v-for="n in names" :key="n.id">{{ n.compagnie }}</li>
    </ul>
  </div>
</template>

<script>
const hierarchy = [
  { name: "Visionnaire", time: 15, exposure: 3 },
  { name: "Pionnier", time: 15, exposure: 3 },
  { name: "Précurseur", time: 15, exposure: 3 },
  { name: "Explorateur", time: 15, exposure: 3 },
  { name: "Découvreur", time: 15, exposure: 2 },
  { name: "Bâtisseur", time: 15, exposure: 2 },
  { name: "Artisan", time: 15, exposure: 1 }
];
export default {
  data() {
    return {
      display_id: null,
      currentNameIndex: 0,
      counter: 0,
      names: [],
      grid: []
    };
  },
  mounted() {},
  async fetch() {
    //Fetch all names in supabase db
    this.display_id = 2;
    const { data, error } = await this.$db
      .from("mcq_content")
      .select("niveau, compagnie, nom, prenom, id");
    if (data) {
      this.names = this.applyExposure(data);
    }
  },

  methods: {
    random(seed) {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
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
    applyExposure(arr) {
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
        mergedNames = mergedNames.concat(this.shuffle(splittedNames[i], 12));
      }
      return mergedNames;
    }
  }
};
</script>

<style lang="scss" scoped></style>
