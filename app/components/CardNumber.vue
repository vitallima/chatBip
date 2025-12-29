<script setup>
	const props = defineProps({
		variant: {
			type: String,
			default: 'default',
			validator: (value) => ['default', 'compact', 'minimal'].includes(value)
		},
		type: {
			type: String,
			default: 'caller',
			validator: (value) => ['caller', 'calle'].includes(value)
		},
		number: {
			type: String,
			default: ''
		},
		loading: {
			type: Boolean,
			default: false
		}
	})
</script>
<template lang="pug">
	.card-number(:class="`card-number--${variant}`, `card-number--${type}`")
		.ring-code(v-if="variant !== 'minimal'")
			.ring-text
			.ring.ring-0
			.ring.ring-1
			.ring.ring-2
			.ring.ring-3
		.number
			//- span.value.loading 12345
			decrypt-text(v-if="type == 'caller'", :text="number" :duration="1500")
			span.value(v-else) {{ number }}
			
			slot(name="action")
			//- .valid(v-if="variant == 'default'")
			//- 	span.label Validade
			//- 	span.text Expira ao sair
		.footer-card(v-if="$slots.footer")
			slot(name="footer")
</template>
<style>
	.card-number{
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 232px;
		border-radius: 16px;
		background-color: var(--color-white);
		box-sizing: border-box;
		transition: all .3s;
		gap: .5rem;

		&.card-number--calle{
			flex-direction: column-reverse;
		}

		&.card-number--compact,	
		&.card-number--default{
			&.card-number--calle{
				padding-bottom: 1.5rem;

				.number{
					.value{
						width: 100%;
						text-align: right;
					}
				}
			}

			&.card-number--caller{
				padding-top: 1.5rem;
			}
		}
		
		&.card-number--minimal{
			.number{
				padding: .5rem;
			}

			&.card-number--calle{
				/* border-bottom-left-radius: 0;
				border-bottom-right-radius: 0; */
				.number{
					.value{
						width: 100%;
						text-align: right;
					}
				}

				&.connected{
					.number{
						padding: .5rem;

						.value{
							font-size: 2rem;
						}
					}
				}
			}

			&.card-number--caller{
				/* border-top-left-radius: 0;
				border-top-right-radius: 0; */
				.number{
					justify-content: space-between;
					flex-direction: row;
					align-items: center;
				}

				&.connected{
					.number{
						padding: .5rem;

						.btn-circle{
							width: 2.5rem;
							height: 2.5rem;
						}

						.value,
						.decrypt-text{
							font-size: 2rem;
						}
					}
				}
			}
		}

		.number{
			display: flex;
			flex-direction: column;
			gap: .5rem;
			width: 100%;
			padding: .75rem;

			.btn-circle{
				display: flex;
				align-items: center;
				justify-content: center;
				width: 3rem;
				height: 3rem;
				border: 2px solid var(--color-black);
				border-radius: 10px;
				color: var(--color-white);
				transition: all .2s;

				&.icon-logout{
					&:before{
						content: "";
						width: 1.5rem;
						height: 1.5rem;
						background-color: var(--color-black);
						mask-image: url('/images/logout.svg');
						mask-size: contain;
						mask-repeat: no-repeat;
					}
				}

				&.icon-end{
					&:before{
						content: "";
						width: 1.5rem;
						height: 1.5rem;
						background-color: var(--color-black);
						mask-image: url('/images/call-end.svg');
						mask-size: contain;
						mask-repeat: no-repeat;
					}
				}

				&:hover{
					background-color: var(--color-black);

					&:before{
						background-color: var(--color-white);
					}
				}
			}
			
			.value{
				font-family: 'ocr';
				font-size: 2.5rem;
			}

			.valid{
				display: flex;
				justify-content: space-between;

				.label{
					font-size: .9rem;
				}

				.text{
					font-family: 'SofiaProMedium';
					font-size: .9rem;
				}
			}
		}

		.footer-card{
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 .75rem .75rem .75rem;
			/* border-top: 1px solid rgba(0, 0, 0, .1); */
			gap: .5rem;

			.btn{
				width: 100%;
				/* background-color: var(--color-black); */
				background-color: transparent;
				border-radius: 6px;
				color: var(--color-black);
				font-family: "SofiaProRegular";
				border: 2px solid #000;
				padding: .8rem 1rem;

				&:hover{
					background-color: var(--color-black);
					color: var(--color-white);
				}
			}
		}
		
		.ring-code{
			position: relative;
			width: 10rem;
			height: 10rem;

			.ring-text{
				position: absolute;
				width: 100%;
				height: 100%;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				margin: auto;
				background-color: #000;
				mask-size: contain;
				mask-position: center;
				mask-repeat: no-repeat;
				mask-image: url('/images/ring-text.svg');
			}

			.ring{
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				margin: auto;
				mask-size: contain;
				mask-position: center;
				mask-repeat: no-repeat;
				background-color: var(--color-red);

				&.ring-0{
					width: 80%;
					height: 80%;
					mask-image: url('/images/ring-0.svg');
				}

				&.ring-1{
					width: 70%;
					height: 70%;
					mask-image: url('/images/ring-1.svg');
				}

				&.ring-2{
					width: 60%;
					height: 60%;
					mask-image: url('/images/ring-2.svg');
				}

				&.ring-3{
					width: 50%;
					height: 50%;
					mask-image: url('/images/ring-3.svg');
				}
			}
		}
	}
</style>