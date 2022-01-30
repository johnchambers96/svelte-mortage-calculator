<script>
  export let price = 250000;
  export let deposit = 25000;
  export let term = 25;
  export let interestRate = 2;
  export let monthlyCost = 0;

  const handleCalculation = () => {
    // monthly interest rate
    const i = interestRate / 100 / 12;
    // total months
    const t = term * 12;
    // total loan amount
    const p = price - deposit;

    monthlyCost =
      p > 0 ? (p * i * Math.pow(1 + i, t)) / (Math.pow(1 + i, t) - 1) : 0;
  };
  handleCalculation();
</script>

<svelte:head>
  <title>Svelte Mortage Calculator</title>
  <meta name="robots" content="noindex nofollow" />
  <meta
    name="description"
    content="Simple web application built in Svelte to calculate monthly mortgage repayments"
  />
  <html lang="en" />
</svelte:head>

<main>
  <h2>Mortage Calculator</h2>
  <div class="input-container">
    <div class="input-container__row">
      <div class="input-field">
        <label for="price"> Price </label>
        <input
          id="price"
          type="number"
          bind:value={price}
          on:change={() => handleCalculation()}
          min="0.0"
          step="1000"
          aria-label="Price"
          placeholder="Price"
        />
      </div>
      <div class="input-field">
        <label for="despoit">
          Deposit {`(${((deposit / price) * 100).toFixed()}%)` || ""}
        </label>
        <input
          id="despoit"
          type="number"
          bind:value={deposit}
          on:change={() => handleCalculation()}
          min="0.0"
          step="1000"
          aria-label="Despoit"
          placeholder="Deposit Amount"
        />
      </div>
    </div>
    <div class="input-container__row">
      <div class="input-field">
        <label for="term"> Repayment term </label>
        <select
          id="term"
          aria-label="Repayment term"
          bind:value={term}
          on:change={() => handleCalculation()}
        >
          {#each Array(35) as _, i}
            {@const year = i + 1}
            <option value={year}
              >{i === 0 ? `${year} year` : `${year} years`}</option
            >
          {/each}
        </select>
      </div>
      <div class="input-field">
        <label for="interest"> Interest rate </label>
        <input
          id="interest"
          type="number"
          min="0.01"
          step="0.01"
          aria-label="Interest rate"
          placeholder="Interest rate"
          bind:value={interestRate}
          on:change={() => handleCalculation()}
        />
      </div>
    </div>
  </div>
  <section class="monthly-total-container">
    <p class="monthly-figure">
      {`£${monthlyCost.toFixed()}`}
    </p>
    <p class="per-month">per month</p>
  </section>
</main>

<style>
  :global(body) {
    padding: 0;
  }

  main {
    display: flex;
    flex-direction: column;
    background-color: #f7f6f5;
    margin: 2rem auto;
    max-width: 960px;
  }

  .input-container {
    display: flex;
    flex-direction: column;
  }

  .input-container__row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0 0.5rem;
    justify-content: center;
  }

  .monthly-total-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem 1rem 1rem;
  }

  h2 {
    margin: 0;
    padding: 1rem;
    font-size: 1.375rem;
    font-weight: 600;
    line-height: 1.25;
    color: #322744;
  }

  .input-field {
    width: calc(50% - 1rem);
    margin: 0.5rem;
  }

  .input-field label {
    display: inline-block;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.375;
    letter-spacing: 0.2px;
    color: #322744;
  }

  input,
  select {
    display: block;
    width: 100%;
    border: 1px solid #d1d0cf;
    padding: 1rem;
    outline: none;
    color: #322744;
    transition: border-color 300ms;
    font-size: 1rem;
  }

  .monthly-figure {
    font-weight: 600;
    font-size: 1.75rem;
    padding: 0 0.25rem;
    margin: 0;
  }

  .per-month {
    font-size: 1rem;
    margin: 0;
  }

  @media only screen and (max-width: 600px) {
    .input-field {
      width: 100%;
      margin: 0 0 0.5rem 0;
    }
    .input-container__row {
      padding: 0 1rem;
    }
  }
</style>
