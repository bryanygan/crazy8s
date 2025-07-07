Current player: asdf at index 1
Getting game state. Current player: asdf (index: 1)
Broadcasting game state for game_wi217uzgb:
  Current Player: asdf (ID: UX7Hi8lU-g46qDRgAAAJ)
  Players: fbsaih(waiting), asdf(CURRENT)
  Sending hand to fbsaih: 9 cards
  Sending hand to asdf: 7 cards
Current player: asdf at index 1
Next player: 1 -> 0 (fbsaih)
Current player: fbsaih at index 0
Getting game state. Current player: fbsaih (index: 0)
Current player: fbsaih at index 0
Getting game state. Current player: fbsaih (index: 0)
Broadcasting game state for game_wi217uzgb:
  Current Player: fbsaih (ID: lL_E_Ct2fGefI0fhAAAH)
  Players: fbsaih(CURRENT), asdf(waiting)
  Sending hand to fbsaih: 9 cards
  Sending hand to asdf: 7 cards
fbsaih (lL_E_Ct2fGefI0fhAAAH) attempting to play cards: [
  { suit: 'Clubs', rank: 'Ace' },
  { suit: 'Hearts', rank: 'Ace' },
  { suit: 'Hearts', rank: 'Jack' },
  { suit: 'Hearts', rank: 'King' }
]
playCard called by lL_E_Ct2fGefI0fhAAAH with cards: [
  { suit: 'Clubs', rank: 'Ace' },
  { suit: 'Hearts', rank: 'Ace' },
  { suit: 'Hearts', rank: 'Jack' },
  { suit: 'Hearts', rank: 'King' }
]
Current player: fbsaih at index 0
Current player: fbsaih, Playing player: fbsaih
🔍 Validating card stack: [ 'Ace of Clubs', 'Ace of Hearts', 'Jack of Hearts', 'King of Hearts' ]
  Checking transition: Ace of Clubs → Ace of Hearts
    Matches suit: false, Matches rank: true, Ace/2 cross: false
    ✅ Valid transition - same rank or Ace/2 cross-stack
  Checking transition: Ace of Hearts → Jack of Hearts
    Matches suit: true, Matches rank: false, Ace/2 cross: false
    Same suit, different rank - checking turn control logic
    Turn control after previous cards: true
    ✅ Valid transition - turn control maintained
  Checking transition: Jack of Hearts → King of Hearts
    Matches suit: true, Matches rank: false, Ace/2 cross: false
    Same suit, different rank - checking turn control logic
    Turn control after previous cards: true
    ✅ Valid transition - turn control maintained
✅ Stack validation passed
🎮 Processing multiple special cards: [ 'Ace of Clubs', 'Ace of Hearts', 'Jack of Hearts', 'King of Hearts' ]
🎮 Simulating turn progression (2 players, starting direction: -1):
  Processing card 1/4: Ace of Clubs
    Ace: +4 draw effect
  Processing card 2/4: Ace of Hearts
    Ace: +4 draw effect
  Processing card 3/4: Jack of Hearts
    Jack: Skip effect
  Processing card 4/4: King of Hearts
    Normal card
🎮 2-player Jacks: 1 skips → keep turn
🎮 2-player: Stack ends with normal/draw/wild card → pass turn
🎮 2-player final result: pass turn (index 1)
🎮 Added 8 to draw stack, total: 8
🎮 Cleared declared suit (no wilds)
🎮 Normal turn advancement based on special card effects
🎮 Turn advanced to index 1: asdf
Current player: asdf at index 1
🎮 Final game state: Player 1 (asdf) has the turn
Current player: asdf at index 1
🎮 Draw stack: 8 cards waiting for asdf
Current player: asdf at index 1
Card play successful. New current player: asdf
Current player: asdf at index 1
Getting game state. Current player: asdf (index: 1)
Card play successful by fbsaih
Current player: asdf at index 1
Getting game state. Current player: asdf (index: 1)
Broadcasting game state for game_wi217uzgb:
  Current Player: asdf (ID: UX7Hi8lU-g46qDRgAAAJ)
  Players: fbsaih(waiting), asdf(CURRENT)
  Sending hand to fbsaih: 5 cards
  Sending hand to asdf: 7 cards
