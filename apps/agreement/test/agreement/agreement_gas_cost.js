const deployer = require('../helpers/utils/deployer')(web3, artifacts)
const { RULINGS } = require('../helpers/utils/enums')

contract('Agreement', ([_, user]) => {
  let disputable, actionId

  beforeEach('deploy disputable instance', async () => {
    disputable = await deployer.deployAndInitializeDisputableWrapper()
  })

  describe('gas costs', () => {
    const itCostsAtMost = (expectedCost, call) => {
      it(`should cost up to ${expectedCost.toLocaleString()} gas`, async () => {
        const { receipt: { gasUsed } } = await call()
        console.log(`gas costs: ${gasUsed.toLocaleString()}`)
        assert.isAtMost(gasUsed, expectedCost)
      })
    }

    context('stake', () => {
      itCostsAtMost(205e3, () => disputable.stake({ user }))
    })

    context('unstake', () => {
      beforeEach('stake', async () => {
        await disputable.stake({ user })
      })

      itCostsAtMost(185e3, () => disputable.unstake({ user }))
    })

    context('newAction', () => {
      itCostsAtMost(303e3, async () => (await disputable.newAction({})).receipt)
    })

    context('closeAction', () => {
      beforeEach('submit action', async () => {
        ({ actionId } = await disputable.newAction({}))
      })

      itCostsAtMost(85e3, () => disputable.close(actionId))
    })

    context('challenge', () => {
      beforeEach('submit action', async () => {
        ({ actionId } = await disputable.newAction({}))
      })

      itCostsAtMost(437e3, async () => (await disputable.challenge({ actionId })).receipt)
    })

    context('settle', () => {
      beforeEach('submit and challenge action', async () => {
        ({ actionId } = await disputable.newAction({}))
        await disputable.challenge({ actionId })
      })

      itCostsAtMost(261e3, () => disputable.settle({ actionId }))
    })

    context('dispute', () => {
      beforeEach('submit and challenge action', async () => {
        ({ actionId } = await disputable.newAction({}))
        await disputable.challenge({ actionId })
      })

      itCostsAtMost(313e3, () => disputable.dispute({ actionId }))
    })

    context('executeRuling', () => {
      beforeEach('submit and dispute action', async () => {
        ({ actionId } = await disputable.newAction({}))
        await disputable.challenge({ actionId })
        await disputable.dispute({ actionId })
      })

      context('refused', () => {
        itCostsAtMost(172e3, () => disputable.executeRuling({ actionId, ruling: RULINGS.REFUSED }))
      })

      context('in favor of the submitter', () => {
        itCostsAtMost(172e3, () => disputable.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_SUBMITTER }))
      })

      context('in favor of the challenger', () => {
        itCostsAtMost(358e3, () => disputable.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_CHALLENGER }))
      })
    })
  })
})
